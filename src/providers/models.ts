import {
  OpenAIModel,
  AnthropicModel,
  GeminiModel,
  DeepSeekModel,
  XAIModel,
  ProviderModel,
  SupportedProvider,
  ModelInfo as ModelInfoType,
} from "../types";

type ModelInfo = ModelInfoType;

export const OPENAI_MODELS: Record<OpenAIModel, ModelInfo> = {
  "gpt-4": {
    id: "gpt-4",
    name: "GPT-4",
    maxTokens: 128000,
    outputTokens: 4096,
  },
  "gpt-4-turbo-preview": {
    id: "gpt-4-turbo-preview",
    name: "GPT-4 Turbo Preview",
    maxTokens: 128000,
    outputTokens: 4096,
  },
  "gpt-3.5-turbo": {
    id: "gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    maxTokens: 16385,
    outputTokens: 4096,
  },
  "gpt-3.5-turbo-16k": {
    id: "gpt-3.5-turbo-16k",
    name: "GPT-3.5 Turbo 16K",
    maxTokens: 16385,
    outputTokens: 4096,
  },
  "gpt-4o": {
    id: "gpt-4o",
    name: "GPT-4 Opus",
    maxTokens: 128000,
    outputTokens: 16384,
  },
  "chatgpt-4o-latest": {
    id: "chatgpt-4o-latest",
    name: "ChatGPT-4 Opus Latest",
    maxTokens: 128000,
    outputTokens: 16384,
  },
  "gpt-4o-mini": {
    id: "gpt-4o-mini",
    name: "GPT-4 Opus Mini",
    maxTokens: 128000,
    outputTokens: 16384,
  },
  o1: {
    id: "o1",
    name: "Opus One",
    maxTokens: 128000,
    outputTokens: 16384,
  },
  "o1-mini": {
    id: "o1-mini",
    name: "Opus One Mini",
    maxTokens: 128000,
    outputTokens: 16384,
  },
  "o3-mini": {
    id: "o3-mini",
    name: "Opus Three Mini",
    maxTokens: 128000,
    outputTokens: 16384,
  },
  "o1-preview": {
    id: "o1-preview",
    name: "Opus One Preview",
    maxTokens: 128000,
    outputTokens: 16384,
  },
};

export const ANTHROPIC_MODELS: Record<AnthropicModel, ModelInfo> = {
  "claude-3-5-sonnet-latest": {
    id: "claude-3-5-sonnet-latest",
    name: "Claude 3.5 Sonnet Latest",
    maxTokens: 200000,
    outputTokens: 8192,
  },
  "claude-3-5-haiku-latest": {
    id: "claude-3-5-haiku-latest",
    name: "Claude 3.5 Haiku Latest",
    maxTokens: 200000,
    outputTokens: 8192,
  },
  "claude-3-opus-latest": {
    id: "claude-3-opus-latest",
    name: "Claude 3 Opus Latest",
    maxTokens: 200000,
    outputTokens: 8192,
  },
  "claude-3-sonnet": {
    id: "claude-3-sonnet",
    name: "Claude 3 Sonnet",
    maxTokens: 200000,
    outputTokens: 8192,
  },
  "claude-3-haiku": {
    id: "claude-3-haiku",
    name: "Claude 3 Haiku",
    maxTokens: 200000,
    outputTokens: 8192,
  },
};

export const GEMINI_MODELS: Record<GeminiModel, ModelInfo> = {
  "gemini-2.0-flash": {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    maxTokens: 1000000,
    outputTokens: 8192,
  },
  "gemini-2.0-flash-lite": {
    id: "gemini-2.0-flash-lite",
    name: "Gemini 2.0 Flash Lite",
    maxTokens: 1000000,
    outputTokens: 8192,
  },
  "gemini-1.5-flash": {
    id: "gemini-1.5-flash",
    name: "Gemini 1.5 Flash",
    maxTokens: 1000000,
    outputTokens: 8192,
  },
  "gemini-1.5-pro": {
    id: "gemini-1.5-pro",
    name: "Gemini 1.5 Pro",
    maxTokens: 2000000,
    outputTokens: 8192,
  },
};

export const DEEPSEEK_MODELS: Record<DeepSeekModel, ModelInfo> = {
  "deepseek-chat": {
    id: "deepseek-chat",
    name: "DeepSeek Chat",
    maxTokens: 32768,
    outputTokens: 2048,
  },
};

export const XAI_MODELS: Record<XAIModel, ModelInfo> = {
  "grok-2-1212": {
    id: "grok-2-1212",
    name: "grok-2-1212",
    maxTokens: 8192,
    outputTokens: 2048,
  },
};

export function isModelDeprecated(model: string): boolean {
  const allModels = {
    ...OPENAI_MODELS,
    ...ANTHROPIC_MODELS,
    ...GEMINI_MODELS,
    ...DEEPSEEK_MODELS,
    ...XAI_MODELS,
  };
  return allModels[model as keyof typeof allModels]?.isDeprecated || false;
}

export function getModelInfo(model: string): ModelInfo | undefined {
  const allModels = {
    ...OPENAI_MODELS,
    ...ANTHROPIC_MODELS,
    ...GEMINI_MODELS,
    ...DEEPSEEK_MODELS,
    ...XAI_MODELS,
  };
  return allModels[model as keyof typeof allModels];
}

export function getDefaultModel(provider: SupportedProvider): ProviderModel {
  switch (provider) {
    case "openai":
      return "gpt-4o";
    case "anthropic":
      return "claude-3-5-sonnet-latest";
    case "gemini":
      return "gemini-2.0-flash";
    case "deepseek":
      return "deepseek-chat";
    case "xai":
      return "grok-2-1212";
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

export function validateModel(provider: string, model: string): void {
  const modelInfo = getModelInfo(model);

  if (!modelInfo) {
    // Instead of throwing an error, just warn about using an unknown model
    console.warn(
      `Warning: Using custom model "${model}" for provider "${provider}". ` +
        `This model is not in our verified list. Make sure it exists in the provider's API.`
    );
    return;
  }

  if (modelInfo.isDeprecated) {
    console.warn(
      `Warning: Model "${model}" is deprecated${
        modelInfo.deprecationDate ? ` since ${modelInfo.deprecationDate}` : ""
      }.${
        modelInfo.replacedBy
          ? ` Consider using ${modelInfo.replacedBy} instead.`
          : ""
      }`
    );
  }
}
