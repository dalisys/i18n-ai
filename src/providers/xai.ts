import axios from "axios";
import { TranslationProvider, XAIModel, TranslationConfig } from "../types";

export class XAIProvider implements TranslationProvider {
  private apiKey: string;
  private config: TranslationConfig;
  name = "xai" as const;
  model: XAIModel;

  constructor(
    apiKey: string,
    model: XAIModel = "grok-2-1212",
    config: TranslationConfig
  ) {
    this.apiKey = apiKey;
    this.model = model;
    this.config = config;
  }

  async translate(text: string, targetLang: string): Promise<string> {
    try {
      let systemPrompt = `You are a professional translator. Translate the following JSON content to ${targetLang}.`;

      if (this.config.description) {
        systemPrompt += `\nContext: ${this.config.description}`;
      }

      if (this.config.tone) {
        systemPrompt += `\nUse a ${this.config.tone} tone in the translations.`;
      }

      systemPrompt +=
        "\nPreserve all JSON structure and keys. Only translate the values. DO NOT modify, translate, or convert numeric keys or values. Return ONLY the translated text without any explanation or markdown.";

      const response = await axios.post(
        "https://api.xai.com/v1/chat/completions",
        {
          model: this.model,
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: text,
            },
          ],
          temperature: 0.1,
          max_tokens: 4096,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data.choices[0].message.content.trim();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Translation failed: ${
            error.response?.data?.error?.message || error.message
          }`
        );
      }
      throw error;
    }
  }
}
