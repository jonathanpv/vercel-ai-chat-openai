// ./app/api/chat/route.ts
import { OpenAIStream, StreamingTextResponse } from 'ai';  // Importing the missing functions
import { OpenAIClient, AzureKeyCredential, ChatMessage } from '@azure/openai'; // Static import
import { OperatingSystemsRole, OperatingSystemsRetrievalRole } from './aitutors';
import { QueryGeneratorMessages } from './queryGenerator';
import type { NextApiRequest, NextApiResponse } from 'next'

// IMPORTANT! Set the runtime to edge
export const runtime = 'edge';

// Use named export for POST method
export async function POST(req: Request, res: Response) {
  // Extract the `prompt` from the body of the request
  // const { messages } = await req.json();
  const { messages } = await req.json() as { messages: ChatMessage[] };

  let role = [ OperatingSystemsRole as ChatMessage ];

  let msg = role.concat(messages);
  // Azure talk to your data setup
  const endpoint = process.env.ENDPOINT || '';
  // Your Azure OpenAI API key
  const azureApiKey = process.env.AZURE_API_KEY || '';
  // Your Azure Cognitive Search endpoint, admin key, and index name
  const azureSearchEndpoint = process.env.AZURE_SEARCH_ENDPOINT;
  const azureSearchAdminKey = process.env.AZURE_SEARCH_KEY;
  const azureSearchIndexName = process.env.AZURE_SEARCH_INDEX;

  const client = new OpenAIClient(endpoint, new AzureKeyCredential(azureApiKey));

  // get intents to search
  const intentDeploymentId = "plutolearning-gpt-35";

  // Destructure the last message from messages array.
  const { content, role: roleS } = messages[messages.length - 1];

  // Check if content is not null before pushing it to QueryGeneratorMessages array.
  if (content !== null) {
    QueryGeneratorMessages.push({ role: roleS, content });
  } else {
    // Handle the case where content is null, e.g., log an error message or throw an error.
    console.error('Content of ChatMessage is null');
  }
  // QueryGeneratorMessages.push(messages[messages.length - 1]);
  const intentMessages = QueryGeneratorMessages;
  const intentEvents = client.listChatCompletions(intentDeploymentId, intentMessages);
  let intents;

  const deploymentId = "plutolearning-gpt4";

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let buffer = "";
      // step 1: the generate queries 
      controller.enqueue(encoder.encode("Searching for...\n\n"));
      for await (const event of intentEvents) {
        for (const choice of event.choices) {
          let content = choice.delta?.content;
          if (content !== null && content !== undefined) {
            const uint8Array = encoder.encode(content);
            buffer += content;
            controller.enqueue(uint8Array);
          }
        }
      }

      // step 2: data retrieval
      let queries;
      if (buffer[0] == "[" && buffer[buffer.length - 1] == "]") {
        queries = JSON.parse(buffer);
      }
      let rawcontext = [];
      let context = [];
      for (const query of queries) {
        let querymessages = [
          { role: "user", content: query }
        ]
        controller.enqueue(encoder.encode(`\nretrieving documents for: ${query}\n`));
        const result = await client.getChatCompletions("plutolearning-gpt-35-turbo-16k", querymessages, {
          maxTokens: 200,
          azureExtensionOptions: {
            extensions: [
              {
                type: "AzureCognitiveSearch",
                parameters: {
                  endpoint: azureSearchEndpoint,
                  key: azureSearchAdminKey,
                  indexName: azureSearchIndexName,
                  topNDocuments: 10,
                  inScope: true,
                  roleInformation: OperatingSystemsRetrievalRole,
                },
              },
            ],
          },
        });
        for (const choice of result.choices) {
          if(choice.message?.context?.messages && choice.message.context.messages.length > 0) {
            rawcontext.push(choice.message.context.messages[0].content);
          }
        
        }
      }
      let contextMessage = "\nEmbedded Context:\n\n";
      // Summarize shit
      if (rawcontext.length >= 1) {
          let summarizeMessages = [
            {role: "system", content: `Don't include URLs. Summarize the following without losing details. When summarizing the provided information, extract and relay specific and crucial details such as exact dates, names, topics, and any numeric information. Do not refer to the information source as a "citation", "document", or "link". Include explicit dates when mentioned, list specific questions or topics, and provide a concise representation of tables or lists present in the information. Prioritize the accuracy and completeness of the information over brevity, maintaining coherence and readability. Avoid any meta-commentary about the information source.`},
            {role: "user", content: rawcontext.join("\n") },
          ]
    
          const summarizeResult = client.listChatCompletions("plutolearning-gpt-35-turbo-16k", summarizeMessages);
          controller.enqueue(encoder.encode("summarizing citations...\n\n"));
    
          
          for await (const event of summarizeResult) {
            for (const choice of event.choices) {
              let content = choice.delta?.content;
              if (content !== null && content !== undefined) {
                const uint8Array = encoder.encode(content);
                contextMessage += content;
                controller.enqueue(uint8Array);
              }
            }
          }
      }
      
      // for (const choice of summarizeResult.choices) {
      //   controller.enqueue(encoder.encode("summarizing citations...\n\n"));
      //   context.push(choice.message.content);
      // }

      // step 3: embed context to final call
      contextMessage += msg[msg.length - 1].content;
      msg[msg.length - 1].content = contextMessage;
      console.log("\n\n\nmsg\n\n", msg);
      const events = client.listChatCompletions("plutolearning-gpt-35-turbo-16k", msg);

      controller.enqueue(encoder.encode("\n\n\nResult: \n\n"));
      for await (const event of events) {
        for (const choice of event.choices) {
          let content = choice.delta?.content;
          if (content !== null && content !== undefined) { // Check if content is not null or undefined
            // replacing the output if it contains "doc"
            if (content.includes("doc")) {
                content = ".";
            } else if (content.includes("{endOfTokens}")) {
                content = " ";
            }
            const uint8Array = encoder.encode(content);
            controller.enqueue(uint8Array);
          }
        }
      }
      controller.close();
    },
  });
  
  // Respond with the stream
  console.log('Returning StreamingTextResponse');
  return new StreamingTextResponse(stream);
}
