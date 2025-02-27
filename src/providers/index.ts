export * from "./openai";
export * from "./anthropic";
export * from "./gemini";
export * from "./deepseek";
export * from "./xai";
export * from "./models";
export * from "./custom";

import { OpenAIProvider } from "./openai";
import { AnthropicProvider } from "./anthropic";
import { GeminiProvider } from "./gemini";
import { DeepSeekProvider } from "./deepseek";
import { XAIProvider } from "./xai";
import { CustomProvider } from "./custom";
import {
  TranslationProvider,
  SupportedProvider,
  ProviderModel,
  TranslationConfig,
} from "../types";
import {
  getDefaultModel,
  validateModel,
  OPENAI_MODELS,
  ANTHROPIC_MODELS,
  GEMINI_MODELS,
  DEEPSEEK_MODELS,
  XAI_MODELS,
} from "./models";

/**
 * Returns information about all available providers and their models
 * @returns An object containing all supported providers and their models
 */
export function getAvailableProviders() {
  return {
    providers: [
      "openai",
      "anthropic",
      "gemini",
      "deepseek",
      "xai",
      "custom",
    ] as SupportedProvider[],
    models: {
      openai: OPENAI_MODELS,
      anthropic: ANTHROPIC_MODELS,
      gemini: GEMINI_MODELS,
      deepseek: DEEPSEEK_MODELS,
      xai: XAI_MODELS,
      custom: {
        "custom-model": {
          id: "custom-model",
          name: "Custom Provider Model",
          maxTokens: 0,
          outputTokens: 0,
        },
      },
    },
    defaultModels: {
      openai: getDefaultModel("openai"),
      anthropic: getDefaultModel("anthropic"),
      gemini: getDefaultModel("gemini"),
      deepseek: getDefaultModel("deepseek"),
      xai: getDefaultModel("xai"),
      custom: "custom-model",
    },
  };
}

export function createProvider(
  type: SupportedProvider,
  apiKey: string,
  config: TranslationConfig,
  model?: ProviderModel
): TranslationProvider {
  // Check if a custom provider is configured and should be used
  if (config.customProvider && config.customProvider.url) {
    return new CustomProvider(config.customProvider, config);
  }

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
    case "custom":
      // This should only happen if someone explicitly sets provider: "custom"
      // but doesn't provide customProvider config - we'll throw a clear error
      if (!config.customProvider || !config.customProvider.url) {
        throw new Error(
          `Custom provider selected but no configuration provided. Please add a 'customProvider' section to your config.`
        );
      }
      return new CustomProvider(config.customProvider, config);
    default:
      throw new Error(`Unsupported provider: ${type}`);
  }
}
