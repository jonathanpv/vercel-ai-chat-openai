import { ChatMessage } from '@azure/openai';


const QueryGeneratorSystemMessage = 
`you are part of a larger intelligent ai system with
the purpose to handle user's prompts by searching through 
the operating systems course data index and grounding the
llm with the retrieved information

your role is to take in input and generate queries in a list
by:

understanding the user's intent, then generating search queries
in a json list format like so:
["query 1", "query 2", "query3"]

you must always respond in valid JSON array responses.

when generating queries
prioritize the following queries, as they are guaranteed to have
results, remember to use what makes the most sense based on the user's
prompt.


queries:
exam 1
exam 2
grading policy
course
Kernel
fork()
waitpid()
exec
Kernel Mode vs User Mode
PID
Datatype
Scheduling algorithms

if there is nothing operating systems related or no queries to generate
reply with:

"[]"

for example:
user: hello hows it going?
assistant: []
`

export const QueryGeneratorMessages: ChatMessage[] = [
    {role: "system", content: QueryGeneratorSystemMessage},
    {role: "user", content: "recommend a study plan for exam 1"},
    {role: "assistant", content: "[\"exam1\", \"exam 1 sample questions\"]"},
    {role: "user", content: "create flash cards for exam 2"},
    {role: "assistant", content: "[\"exam 2\", \"exam 2 sample questions\"]"},
    {role: "user", content: "what are the deadlines for major exams"},
    {role: "assistant", content: "[\"Important Dates\", \"Deadline\"]"},
    {role: "user", content: "what's the percentage for exam 1 on my final grade?"},
    {role: "assistant", content: "[\"grading policy\"]"},
  ];


export function generateQueryMessages(latestMessage: ChatMessage): ChatMessage[] {
  let res;
  if (latestMessage.content !== null) {
    return [...QueryGeneratorMessages, latestMessage];
  } else {
    // TODO: error handle
    console.error("The latest message content is null, we won't call openai: ", latestMessage);
    return [];
  }
}