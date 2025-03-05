export type SupportedLanguage = string;
export type SupportedProvider =
  | "openai"
  | "anthropic"
  | "gemini"
  | "deepseek"
  | "xai"
  | "custom";

export type OpenAIModel =
  | "gpt-4"
  | "gpt-4-turbo-preview"
  | "gpt-3.5-turbo"
  | "gpt-4o"
  | "chatgpt-4o-latest"
  | "gpt-4o-mini"
  | "o1"
  | "o1-mini"
  | "o3-mini";

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

export interface ExportConfig {
  /**
   * Path where the CSV file will be saved
   * @default './translations-export.csv'
   */
  outputPath?: string;

  /**
   * Character to use as CSV delimiter
   * @default ','
   */
  delimiter?: string;
}

export interface ImportConfig {
  /**
   * Character to use as CSV delimiter
   * @default ','
   */
  delimiter?: string;

  /**
   * Whether to skip the first row (header)
   * @default true
   */
  skipHeader?: boolean;

  /**
   * Whether to overwrite existing translations
   * @default false
   */
  overwrite?: boolean;
}

export interface CustomProviderConfig {
  /**
   * The URL endpoint for the custom translation provider
   */
  url: string;

  /**
   * HTTP method to use (default: POST)
   */
  method?: "GET" | "POST";

  /**
   * Custom headers to send with the request (add your own auth headers here)
   */
  headers?: Record<string, string>;

  /**
   * Request body template as an object or JSON string
   * Use "{{text}}" placeholder where the text to translate should be inserted
   * Use "{{targetLang}}" placeholder where the target language code should be inserted
   * Use "{{sourceLang}}" placeholder where the source language code should be inserted
   * Example: {"text": "{{text}}", "to": "{{targetLang}}", "from": "{{sourceLang}}"}
   */
  body?: string | object;

  /**
   * JSON path to extract the translated text from the response
   * Example: "data.translation" or "result"
   * If not provided, the entire response body will be treated as the translation
   */
  responsePath?: string;
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
  /**
   * CSV export configuration
   */
  export?: ExportConfig;
  /**
   * CSV import configuration
   */
  import?: ImportConfig;
  /**
   * Custom provider configuration
   * When specified, this takes precedence over the regular provider
   */
  customProvider?: CustomProviderConfig;
  /**
   * Whether to stop the entire translation process if an error occurs
   * Default: true
   */
  stopOnError?: boolean;
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
  totalChunks: number;
  processedChunks: number;
  failedChunkIndex: number | null;
  errorDetails: Error | null;
}
