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
  private lastRequestTime: number = 0;
  private readonly minRequestInterval: number = 200; // Minimum time between requests in ms

  constructor(
    apiKey: string,
    model: AnthropicModel = "claude-3-5-haiku-latest",
    config: TranslationConfig
  ) {
    this.apiKey = apiKey;
    this.model = model;
    this.config = config;
  }

  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.minRequestInterval) {
      await new Promise((resolve) =>
        setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest)
      );
    }
    this.lastRequestTime = Date.now();
  }

  async translate(text: string, targetLang: string): Promise<string> {
    try {
      await this.rateLimit();

      console.log("Translating text with Anthropic");

      let systemPrompt = `You are a professional translator. Translate the following JSON content to ${targetLang}.`;

      if (this.config.description) {
        systemPrompt += `\nContext: ${this.config.description}`;
      }

      if (this.config.tone) {
        systemPrompt += `\nUse a ${this.config.tone} tone in the translations.`;
      }

      systemPrompt +=
        "\nPreserve all JSON structure and keys. Only translate the values. DO NOT modify, translate, or convert numeric keys or values. Return ONLY the translated text without any explanation or markdown. output in JSON format.";

      console.log("Sending request to Anthropic");

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

      if (!response.data.content || !response.data.content[0]?.text) {
        throw new Error("Invalid response format from Anthropic API");
      }

      const translatedText = response.data.content[0].text.trim();

      // Validate JSON response
      try {
        JSON.parse(translatedText);
      } catch (error) {
        console.warn(
          "Response is not valid JSON, but proceeding with raw text"
        );
      }

      return translatedText;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const message = error.response?.data?.error?.message || error.message;

        // Handle rate limiting
        if (status === 429) {
          const retryAfter = parseInt(
            error.response?.headers["retry-after"] || "5"
          );
          await new Promise((resolve) =>
            setTimeout(resolve, retryAfter * 1000)
          );
          return this.translate(text, targetLang); // Retry the request
        }

        throw new Error(`Translation failed (${status}): ${message}`);
      }
      throw error;
    }
  }
}
