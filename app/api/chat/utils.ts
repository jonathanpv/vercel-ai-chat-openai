import { ChatCompletions, ChatRole } from "@azure/openai";

// Define the streamable generator function
export async function* streamableChatCompletions(stream: AsyncIterable<ChatCompletions>): AsyncGenerator<Uint8Array, void, undefined> {
    const encoder = new TextEncoder();
    
    for await (const completion of stream) {
      const text = completion.choices[0]?.delta?.content;
      if (text) yield encoder.encode(text);
      await new Promise(res => setTimeout(res, 30)); // Introduce a delay of 100ms between yields
    }
  }

export async function* streamableString(stream: string): AsyncGenerator<Uint8Array, void, undefined> {
  const encoder = new TextEncoder();

  for (let letter of stream) {
    yield encoder.encode(letter);
    await new Promise(res => setTimeout(res, 30));
  }
}

export function createStream(iterator: AsyncGenerator<Uint8Array, void, undefined>) {
    return new ReadableStream({
      async pull(controller) {
        const { value, done } = await iterator.next();
   
        if (done) {
          controller.close();
        } else {
          controller.enqueue(value);
        }
      },
    });
  }

export async function enqueueStreamable(controller: ReadableStreamDefaultController<any>, iterator: AsyncGenerator<Uint8Array, void, undefined>) {
  const {value, done} = await iterator.next();

  controller.enqueue(value);
}

export async function generatorToArray(generator: AsyncGenerator<Uint8Array, void, undefined>): Promise<string[]> {
    const array: string[] = [];
    for await (const value of generator) {
      array.push(new TextDecoder().decode(value));
    }
    return array;
  }


export function extractMessage(result: ChatCompletions, role: ChatRole): string {
    for (const choice of result.choices) {
        if(choice.message && choice.message.content && choice.message.role == role) {
          return choice.message.content;
        }
      }
    return "";
}
