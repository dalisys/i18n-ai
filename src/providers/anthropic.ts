import axios from "axios";
import {
  TranslationProvider,
  AnthropicModel,
  TranslationConfig,
} from "../types";

export class AnthropicProvider implements TranslationProvider {
  private apiKey: string;
  private config: TranslationConfig;
  name = "anthropic" as const;
  model: AnthropicModel;

  constructor(
    apiKey: string,
    model: AnthropicModel = "claude-3-5-sonnet-latest",
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
        "\nPreserve all JSON structure and keys. Only translate the values. Return ONLY the translated text without any explanation or markdown.";

      const response = await axios.post(
        "https://api.anthropic.com/v1/messages",
        {
          model: this.model,
          messages: [
            {
              role: "user",
              content: `${systemPrompt}\n\n${text}`,
            },
          ],
          max_tokens: 4096,
        },
        {
          headers: {
            "x-api-key": this.apiKey,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
          },
        }
      );

      return response.data.content[0].text.trim();
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
