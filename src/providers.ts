import { ExtensionGlobalState } from "./interfaces";
import Provider from "./provider";

export class OllamaProvider extends Provider {
  constructor(params: ExtensionGlobalState) {
    super(params);
  }

  async listAvailableModels() {
    if (!this.apiInstance) {
      return [];
    }

    try {
      const response = await this.apiInstance.get("tags");
      return response.data["models"].map((model: any) => model.name);
    } catch (e) {
      return [];
    }
  }

  preExtractData(data: any) {}

  async askQuestion(
    prompt: string,
    question: string,
    model: string,
    continuousStreamResponseCallback: (data: string) => void
  ) {
    if (!this.apiInstance) {
      return false;
    }

    let _model: string = model;

    if (model.includes(":")) {
      _model = model.split(":")[0];
    }
    try {
      const response = await this.apiInstance.post("chat", {
        model: _model,
        stream: false,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      let data: string = response.data["message"]["content"];

      if (data.includes("```")) {
        data = data.substring(data.indexOf("```") + 3, data.lastIndexOf("```"));
      }

      continuousStreamResponseCallback(data);
    } catch (e) {
      console.log(e);
      return false;
    }
    return true;
  }
}
