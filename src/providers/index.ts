export * from "./openai";
export * from "./anthropic";
export * from "./gemini";
export * from "./deepseek";
export * from "./xai";
export * from "./models";

import { OpenAIProvider } from "./openai";
import { AnthropicProvider } from "./anthropic";
import { GeminiProvider } from "./gemini";
import { DeepSeekProvider } from "./deepseek";
import { XAIProvider } from "./xai";
import {
  TranslationProvider,
  SupportedProvider,
  ProviderModel,
  TranslationConfig,
} from "../types";
import { getDefaultModel, validateModel } from "./models";

export function createProvider(
  type: SupportedProvider,
  apiKey: string,
  config: TranslationConfig,
  model?: ProviderModel
): TranslationProvider {
  // Validate and get default model if needed
  const finalModel = model || getDefaultModel(type);
  validateModel(type, finalModel);

  switch (type) {
    case "openai":
      return new OpenAIProvider(apiKey, finalModel as any, config);
    case "anthropic":
      return new AnthropicProvider(apiKey, finalModel as any, config);
    case "gemini":
      return new GeminiProvider(apiKey, finalModel as any, config);
    case "deepseek":
      return new DeepSeekProvider(apiKey, finalModel as any, config);
    case "xai":
      return new XAIProvider(apiKey, finalModel as any, config);
    default:
      throw new Error(`Unsupported provider: ${type}`);
  }
}
