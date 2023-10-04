import { UseChatHelpers } from 'ai/react'

import { Button } from '@/components/ui/button'
import { ExternalLink } from '@/components/external-link'
import { IconArrowRight } from '@/components/ui/icons'

const exampleMessages = [
  {
    heading: 'Ask when a exam 1 will happen',
    message: `When will we have exam 1?`
  },
  {
    heading: 'Create a study plan for upcoming exams',
    message: `Help me create a studyplan for the exam 2 questions\n`
  },
  {
    heading: 'Ask domain specific questions',
    message: `What are deadlocks in OS and what will the professor expect us to know about this? \n`
  }
]

export function EmptyScreen({ setInput }: Pick<UseChatHelpers, 'setInput'>) {
  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="rounded-lg border bg-background p-8">
        <h1 className="mb-2 text-lg font-semibold">
          Welcome to Pluto Learning Demo!
        </h1>
        <p className="mb-2 leading-normal text-muted-foreground">
          This is a demo for AI tutors, we currently have a vector-search enabled data source using {' '}
          <ExternalLink href="https://azure.microsoft.com/en-us/products/ai-services/openai-service">Azure Open AI</ExternalLink> and vector search using {' '}
          <ExternalLink href="https://azure.microsoft.com/en-us/products/ai-services/cognitive-search">
            Azure Cognitive Search
          </ExternalLink>
          .
        </p>
        <p className="leading-normal text-muted-foreground">
          This demo currently has an AI tutor grounded an operating systems university course:
        </p>
        <div className="mt-4 flex flex-col items-start space-y-2">
          {exampleMessages.map((message, index) => (
            <Button
              key={index}
              variant="link"
              className="h-auto p-0 text-base"
              onClick={() => setInput(message.message)}
            >
              <IconArrowRight className="mr-2 text-muted-foreground" />
              {message.heading}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
