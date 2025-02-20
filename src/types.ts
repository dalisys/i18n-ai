export type SupportedLanguage = string;
export type SupportedProvider =
  | "openai"
  | "anthropic"
  | "gemini"
  | "deepseek"
  | "xai";

export type OpenAIModel =
  | "gpt-4"
  | "gpt-4-turbo-preview"
  | "gpt-3.5-turbo"
  | "gpt-3.5-turbo-16k"
  | "gpt-4o"
  | "chatgpt-4o-latest"
  | "gpt-4o-mini"
  | "o1"
  | "o1-mini"
  | "o3-mini"
  | "o1-preview";

export type AnthropicModel =
  | "claude-3-5-sonnet-latest"
  | "claude-3-5-haiku-latest"
  | "claude-3-opus-latest"
  | "claude-3-sonnet"
  | "claude-3-haiku";

export type GeminiModel =
  | "gemini-2.0-flash"
  | "gemini-2.0-flash-lite"
  | "gemini-1.5-flash"
  | "gemini-1.5-pro";

export type DeepSeekModel = "deepseek-chat";
export type XAIModel = "grok-2-1212";

export type ProviderModel =
  | OpenAIModel
  | AnthropicModel
  | GeminiModel
  | DeepSeekModel
  | XAIModel
  | string;

export interface ModelInfo {
  id: string;
  name: string;
  maxTokens: number;
  outputTokens: number;
  isDeprecated?: boolean;
  deprecationDate?: string;
  replacedBy?: string;
}

export interface LanguageFile {
  path: string;
  code: SupportedLanguage;
}

export interface ProviderConfig {
  provider: SupportedProvider;
  model?: ProviderModel;
}

export interface TranslationConfig {
  source: LanguageFile;
  targets: LanguageFile[];
  provider: SupportedProvider;
  model?: ProviderModel;
  chunkSize?: number;
  concurrency?: number;
  overwrite?: boolean;
  description?: string;
  tone?: string;
  translateAllAtOnce?: boolean;
  ignoreKeys?: string[];
}

export interface TranslateFilesOptions {
  configPath?: string;
  overwrite?: boolean;
}

export interface TranslationProvider {
  translate(text: string, targetLang: string): Promise<string>;
  name: SupportedProvider;
  model: ProviderModel;
}

export interface TranslationResult {
  success: boolean;
  translatedText?: string;
  error?: Error;
}

export interface TranslationStats {
  totalKeys: number;
  newKeys: number;
  skippedKeys: number;
  errors: number;
}
