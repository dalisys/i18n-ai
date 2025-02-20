import { config as dotenvConfig } from "dotenv";
import { TranslationConfig } from "./types";
import path from "path";
import fs from "fs";
import { validateModel, getDefaultModel } from "./providers/models";

// Load environment variables
dotenvConfig();

const DEFAULT_CONFIG: Partial<TranslationConfig> = {
  provider: "openai",
  chunkSize: 50,
  concurrency: 3,
  overwrite: false,
};

export function loadConfig(configPath?: string): TranslationConfig {
  const defaultConfigPath = path.resolve(
    process.cwd(),
    "translator.config.json"
  );
  const finalConfigPath = configPath || defaultConfigPath;

  if (!fs.existsSync(finalConfigPath)) {
    throw new Error(`Config file not found at ${finalConfigPath}`);
  }

  try {
    const configContent = fs.readFileSync(finalConfigPath, "utf-8");
    const userConfig = JSON.parse(configContent);

    const config = {
      ...DEFAULT_CONFIG,
      ...userConfig,
    } as TranslationConfig;

    // Set default model if not specified
    if (!config.model) {
      config.model = getDefaultModel(config.provider);
    }

    return config;
  } catch (error) {
    throw new Error(
      `Failed to load config file: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export function validateConfig(config: TranslationConfig): void {
  // Validate source file
  if (!config.source || !config.source.path || !config.source.code) {
    throw new Error("Source file configuration is missing or invalid");
  }

  if (!fs.existsSync(config.source.path)) {
    throw new Error(`Source file not found: ${config.source.path}`);
  }

  // Validate target files
  if (
    !config.targets ||
    !Array.isArray(config.targets) ||
    config.targets.length === 0
  ) {
    throw new Error("At least one target language must be specified");
  }

  for (const target of config.targets) {
    if (!target.path || !target.code) {
      throw new Error("Target file configuration is missing or invalid");
    }

    // Create directory if it doesn't exist
    const targetDir = path.dirname(target.path);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
  }

  // Validate provider and model
  validateModel(
    config.provider,
    config.model || getDefaultModel(config.provider)
  );

  // Validate provider and API key
  const apiKey = process.env[`${config.provider.toUpperCase()}_API_KEY`];
  if (!apiKey) {
    throw new Error(
      `${config.provider.toUpperCase()}_API_KEY environment variable is required`
    );
  }
}
