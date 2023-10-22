// ./app/api/chat/route.ts
import { AIStream, OpenAIStream, StreamingTextResponse, readableFromAsyncIterable } from 'ai';
import { OpenAIClient, AzureKeyCredential, ChatMessage, ChatCompletions, ChatRole } from '@azure/openai';
import { OSTutorSystemMessage, OperatingSystemsRetrievalRole } from './aitutors';
import { generateQueryMessages } from './queryGenerator';
import type { NextApiRequest, NextApiResponse } from 'next';
import { ENDPOINT, AZURE_API_KEY, AZURE_SEARCH_ENDPOINT, AZURE_SEARCH_KEY, AZURE_SEARCH_INDEX, GPT_35_DEPLOYMENT, INFORMATION_RETRIEVAL_AZURE_COGNITIVE_SEARCH_OPTIONS, GPT_35_16K_DEPLOYMENT } from './constants';
import { streamableChatCompletions, createStream, generatorToArray, extractMessage } from './utils';
import { generateIsDocumentInScopeMessages } from './isDocumentInScopeAgent';

// IMPORTANT! Set the runtime to edge
export const runtime = 'edge';

export async function POST(req: Request, res: Response) {
  // Extract the `prompt` from the body of the request
  const { messages } = await req.json() as { messages: ChatMessage[] };
  let msg: ChatMessage[] = [ OSTutorSystemMessage, ...messages ];

  const client = new OpenAIClient(ENDPOINT, new AzureKeyCredential(AZURE_API_KEY));

  const latestMessage: ChatMessage = messages[messages.length - 1];
  
  // These messages instruct gpt to generate search queries based on the latest message (prompt)
  const queryMessages = generateQueryMessages(latestMessage);

  // plan make the query step, synchronous
  // create a generator that simulates animation of text that says hey we are searching for x, y, z queries
  const intentEvents: ChatCompletions = await client.getChatCompletions(GPT_35_16K_DEPLOYMENT, queryMessages);
  let intents: string = extractMessage(intentEvents, "assistant" as ChatRole);
  let queries;
  if (intents[0] == "[" && intents[intents.length - 1] == "]") {
    queries = JSON.parse(intents);
  }

  // get documents from each query
  let documents = [];
  for (const query of queries) {
    let citations;
    let querymessage = [
      { role: "user", content: query }
    ]
    const result = await client.getChatCompletions(GPT_35_16K_DEPLOYMENT, querymessage, INFORMATION_RETRIEVAL_AZURE_COGNITIVE_SEARCH_OPTIONS);
    for (const choice of result.choices) {
      if(choice.message?.context?.messages  && choice.message.context.messages.length > 0 && choice.message.context.messages[0].content) {
        citations = JSON.parse(choice.message.context.messages[0].content);
      }
    }

    if (citations) {
      for (const citation of citations.citations) {
        let isDocumentInScopeMessageContent = `intent: ${citations.intent}\n\ndocument filename: ${citation.filepath}\n\ndocument content:\n${citation.content}`
        let isDocumentInScopeMessage = { role: "user", content: isDocumentInScopeMessageContent } as ChatMessage;
        let isDocumentInScopeMessages = generateIsDocumentInScopeMessages(isDocumentInScopeMessage);

        const isInScopeEvents = await client.getChatCompletions(GPT_35_16K_DEPLOYMENT, isDocumentInScopeMessages);
        let isInScope: string = extractMessage(isInScopeEvents, "assistant" as ChatRole);

        if (isInScope == "yes") {
          documents.push(citation);
        }
      }
    }
  }

  // create a generator that simulates, summarization steps
  // then pass the summaries embedded onto the final gpt-35 context
  const documentStrings = documents.map(doc => JSON.stringify(doc)).join("\n");
  const embeddedContextMessage = `embeddedContext:\n${documents.length === 0 ? "[]" : documentStrings}\nprompt:\n${latestMessage.content}`;
  const finalMsgs = [ OSTutorSystemMessage, { role: "user", content: embeddedContextMessage } ];
  const finalMsgEvents: AsyncIterable<ChatCompletions> = await client.listChatCompletions(GPT_35_16K_DEPLOYMENT, finalMsgs);

  // Convert events to a ReadableStream
  const stream = createStream(streamableChatCompletions(finalMsgEvents));

  // Respond with the stream
  console.log('Returning StreamingTextResponse');
  return new StreamingTextResponse(stream);
}
