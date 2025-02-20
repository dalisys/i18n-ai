import axios from "axios";
import { TranslationProvider, GeminiModel, TranslationConfig } from "../types";

export class GeminiProvider implements TranslationProvider {
  private apiKey: string;
  private config: TranslationConfig;
  name = "gemini" as const;
  model: GeminiModel;

  constructor(
    apiKey: string,
    model: GeminiModel = "gemini-2.0-flash-lite",
    config: TranslationConfig
  ) {
    this.apiKey = apiKey;
    this.model = model;
    this.config = config;
  }

  async translate(text: string, targetLang: string): Promise<string> {
    try {
      let prompt = `Translate the following JSON content to ${targetLang}.`;

      if (this.config.description) {
        prompt += `\nContext: ${this.config.description}`;
      }

      if (this.config.tone) {
        prompt += `\nUse a ${this.config.tone} tone in the translations.`;
      }

      prompt +=
        "\nPreserve all JSON structure and keys. Only translate the values. Return ONLY the translated text without any explanation or markdown.\n\n";
      prompt += text;

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1/models/${this.model}:generateContent?key=${this.apiKey}`,
        {
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            topK: 1,
            topP: 1,
            maxOutputTokens: 8192,
          },
        }
      );

      return response.data.candidates[0].content.parts[0].text.trim();
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
