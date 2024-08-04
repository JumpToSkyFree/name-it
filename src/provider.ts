import axios, { AxiosError } from "axios";
import { ExtensionGlobalState } from "./interfaces";

export interface IProvider {
  setup: () => void;
  listAvailableModels?: () => Promise<Array<string> | undefined>;
  askQuestion?: (
    prompt: string,
    question: string,
    model: string,
    continuousStreamResponseCallback: (data: string) => void
  ) => void;
}

export default class Provider implements IProvider {
  params: ExtensionGlobalState;
  apiInstance?: ReturnType<typeof axios.create>;

  constructor(params: ExtensionGlobalState) {
    this.params = params;
  }

  async setup() {
    if (this.params.apiKey && this.params.apiKeyHeader) {
      this.apiInstance = axios.create({
        baseURL: this.params.api,
        timeout: this.params.timeout,
        headers: {
          [this.params.apiKeyHeader as string]: this.params.apiKey,
        },
      });
    } else {
      this.apiInstance = axios.create({
        baseURL: this.params.api,
        timeout: this.params.timeout,
      });
    }

    let serverListens = true;

    try {
      await this.apiInstance.get("");
    } catch (reason) {
      const err = reason as AxiosError;
      if (err.code === "ECONNREFUSED") {
        serverListens = false;
      }
    }

    return serverListens;
  }

  async listAvailableModels() {
    return [];
  }

  async askQuestion(
    prompt: string,
    question: string,
    model: string,
    continuousStreamResponseCallback: (data: string) => void
  ): Promise<boolean> {
    return false;
  }
}
