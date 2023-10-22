import { ChatMessage } from '@azure/openai';


const isDocumentInScopeSystemMessage = 
`you are part of a larger intelligent ai system with
the purpose to handle user's prompts by searching through 
the operating systems course data index and grounding the
llm with the retrieved information

you will be given two inputs, the user's intent and
a potential relevant document.

your role is to classify if the document helps, contains relevant
data, or is useful to answer the user's intent.

if it does help the user's intent reply with "yes"
if it does not help the user's intent reply with "no"

only reply with "yes" or "no"

never reply with anything else.

for extra context:
the user will be prompting you with intents for a university level
operating system course. they may prompt about exam dates, operating
systems specific knowledge, information from the syllabus, information
from exams, information from textbooks, etc.

your work will help the user learn more efficiently and contribute
to their success and happiness.
`

export const isDocumentInScopeMessages: ChatMessage[] = [
    {role: "system", content: isDocumentInScopeSystemMessage},
    {role: "user", content: "intent: exam 1\n\ndocument: <snippet of syllabus containing exam 1 dates>"},
    {role: "assistant", content: "yes"},
    {role: "user", content: "intent: exam 2 sample questions\n\ndocument: <snippet of previous exam 2 containing specific questions>"},
    {role: "assistant", content: "yes"},
    {role: "user", content: "intent: what are the deadlines for major exams\n\ndocument: <snippet of exam 2 containing specific questions>"},
    {role: "assistant", content: "no"},
    {role: "user", content: "intent: grading policy\n\ndocument: <snippet of syllabus containing the grading policy>"},
    {role: "assistant", content: "yes"},
  ];


export function generateIsDocumentInScopeMessages(query: ChatMessage): ChatMessage[] {
  if (query.content !== null) {
    return [...isDocumentInScopeMessages, query];
  } else {
    // TODO: error handle
    console.error("The latest message content is null, we won't call openai: ", query);
    return [];
  }
}