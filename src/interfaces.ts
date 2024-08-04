import Provider from "./provider";

export interface Providers {
  [name: string]: Partial<{
    provider: Provider;
    defaultAPIUrl?: string;
    needAPIKey: boolean;
    timeout: number;
    availableModels: string;
    activeModel: string;
  }>;
}

export type ExtensionGlobalState = Partial<{
  providerName: string;
  api: string;
  apiKeyHeader: string;
  apiKey: string;
  needAPIKey: boolean;
  timeout: number;
  activeModel: string;
}>;
