import { OSTutorSystemMessage, OperatingSystemsRetrievalRole } from './aitutors';

// Azure talk to your data setup
export const ENDPOINT = process.env.ENDPOINT || '';
// Your Azure OpenAI API key
export const AZURE_API_KEY = process.env.AZURE_API_KEY || '';
// Your Azure Cognitive Search endpoint, admin key, and index name
export const AZURE_SEARCH_ENDPOINT = process.env.AZURE_SEARCH_ENDPOINT;
export const AZURE_SEARCH_KEY = process.env.AZURE_SEARCH_KEY;
export const AZURE_SEARCH_INDEX = process.env.AZURE_SEARCH_INDEX;

export const GPT_35_DEPLOYMENT = "plutolearning-gpt-35";
export const GPT_35_16K_DEPLOYMENT = "plutolearning-gpt-35-turbo-16k";

export const INFORMATION_RETRIEVAL_AZURE_COGNITIVE_SEARCH_OPTIONS = {
    maxTokens: 200,
    azureExtensionOptions: {
      extensions: [
        {
          type: "AzureCognitiveSearch",
          parameters: {
            endpoint: AZURE_SEARCH_ENDPOINT,
            key: AZURE_SEARCH_KEY,
            indexName: AZURE_SEARCH_INDEX,
            topNDocuments: 10,
            inScope: true,
            roleInformation: OperatingSystemsRetrievalRole,
          },
        },
      ],
    },
  };
