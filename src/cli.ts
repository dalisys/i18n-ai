#!/usr/bin/env node

import { Command } from "commander";
import { translateFiles } from "./translator";
import { exportTranslationsToCSV } from "./export";
import { loadConfig } from "./config";
import {
  OPENAI_MODELS,
  ANTHROPIC_MODELS,
  GEMINI_MODELS,
  DEEPSEEK_MODELS,
  XAI_MODELS,
} from "./providers/models";
import { importTranslationsFromCSV } from "./import";
import { getAvailableProviders } from "./providers";

const program = new Command();

program
  .name("i18n-ai")
  .description(
    `AI-powered translation tool for i18n JSON files
    
Features:
  • Translates i18n JSON files using AI language models
  • Supports multiple AI providers (OpenAI, Anthropic, Gemini, DeepSeek, XAI)
  • Preserves JSON structure and nested keys
  • Smart chunking for large files
  • Handles existing translations
  • Configurable translation settings`
  )
  .version("0.1.0");

program
  .command("translate")
  .description("Translate i18n JSON files")
  .option(
    "-c, --config <path>",
    "Path to config file (default: translator.config.json)"
  )
  .option("-o, --overwrite", "Overwrite existing translations")
  .addHelpText(
    "after",
    `
Configuration File (translator.config.json):
  {
    "source": {
      "path": "./locales/en.json",    // Source language file
      "code": "en"                    // Source language code
    },
    "targets": [{                     // Target languages to translate to
      "path": "./locales/es.json",
      "code": "es"
    }],
    "provider": "openai",             // AI provider to use
    "model": "gpt-4",                 // Model to use (optional)
    "chunkSize": 50,                 // Number of keys per chunk (default: 50)
    "description": "My app context",   // Project context for better translations
    "tone": "formal",                 // Desired tone (formal/casual/technical)
    "translateAllAtOnce": false,      // Translate entire file at once
    "overwrite": false,               // Overwrite existing translations
    "customProvider": {               // Custom translation API configuration
      "url": "https://api.example.com/translate", // API endpoint
      "method": "POST",               // HTTP method (default: POST)
      "headers": {},                  // Custom HTTP headers
      "body": {},                     // Request body template (supports placeholders)
      "responsePath": "translation",  // Path to extract result from response
      "apiKeyEnvVar": "CUSTOM_API_KEY" // Env var with API key
    }
  }

Environment Variables:
  OPENAI_API_KEY       - OpenAI API key
  ANTHROPIC_API_KEY    - Anthropic API key
  GEMINI_API_KEY       - Google Gemini API key
  DEEPSEEK_API_KEY     - DeepSeek API key
  XAI_API_KEY          - XAI API key
  [custom env var]     - For custom provider if configured

Examples:
  $ i18n-ai translate                         # Use default config
  $ i18n-ai translate -c custom-config.json   # Use custom config
  $ i18n-ai translate --overwrite            # Overwrite existing translations
  `
  )
  .action(async (options) => {
    try {
      await translateFiles({
        configPath: options.config,
        overwrite: options.overwrite,
      });
    } catch (error) {
      console.error("Translation failed:", error);
      process.exit(1);
    }
  });

program
  .command("models")
  .description("List available AI models")
  .option(
    "-p, --provider <provider>",
    "Show models for specific provider (openai, anthropic, gemini, deepseek, xai)"
  )
  .addHelpText(
    "after",
    `
Examples:
  $ i18n-ai models                  # List all available models
  $ i18n-ai models --provider openai # List OpenAI models only
    `
  )
  .action((options) => {
    const showModels = (name: string, models: any) => {
      console.log(`\n${name.toUpperCase()}:`);
      const modelList = Object.keys(models).join(" | ");
      console.log(modelList);
      console.log();
    };

    if (options.provider) {
      const provider = options.provider.toLowerCase();
      switch (provider) {
        case "openai":
          showModels("OpenAI", OPENAI_MODELS);
          break;
        case "anthropic":
          showModels("Anthropic", ANTHROPIC_MODELS);
          break;
        case "gemini":
          showModels("Gemini", GEMINI_MODELS);
          break;
        case "deepseek":
          showModels("DeepSeek", DEEPSEEK_MODELS);
          break;
        case "xai":
          showModels("XAI", XAI_MODELS);
          break;
        default:
          console.error(`Unknown provider: ${provider}`);
          process.exit(1);
      }
    } else {
      showModels("OpenAI", OPENAI_MODELS);
      showModels("Anthropic", ANTHROPIC_MODELS);
      showModels("Gemini", GEMINI_MODELS);
      showModels("DeepSeek", DEEPSEEK_MODELS);
      showModels("XAI", XAI_MODELS);
    }
  });

program
  .command("export")
  .description("Export translations to CSV format")
  .option(
    "-c, --config <path>",
    "Path to config file (default: translator.config.json)"
  )
  .option(
    "-o, --output <path>",
    "Output path for CSV file (default: translations-export.csv)"
  )
  .option("-d, --delimiter <char>", "Delimiter to use in CSV (default: ,)")
  .addHelpText(
    "after",
    `
Examples:
  $ i18n-ai export                           # Use default settings
  $ i18n-ai export --output ./exports/translations.csv
  $ i18n-ai export --delimiter ";"
  $ i18n-ai export -c custom-config.json     # Use custom config
    `
  )
  .action(async (options) => {
    try {
      const config = loadConfig(options.config);
      await exportTranslationsToCSV(config, {
        outputPath: options.output,
        delimiter: options.delimiter,
      });
    } catch (error) {
      console.error("Export failed:", error);
      process.exit(1);
    }
  });

program
  .command("import")
  .description("Import translations from a CSV file")
  .option(
    "-c, --config <path>",
    "Path to config file (default: translator.config.json)"
  )
  .option("-i, --input <path>", "Input CSV file path")
  .option("-d, --delimiter <char>", "Delimiter to use in CSV (default: ,)")
  .option("--no-header", "Skip header row in CSV")
  .option("-o, --overwrite", "Overwrite existing translations")
  .addHelpText(
    "after",
    `
Examples:
  $ i18n-ai import -i translations.csv              # Use default settings
  $ i18n-ai import -i ./data/translations.csv       # Custom input path
  $ i18n-ai import -i translations.csv -d ";"       # Custom delimiter
  $ i18n-ai import -i translations.csv --no-header  # Skip header row
  $ i18n-ai import -i translations.csv --overwrite  # Overwrite existing
  $ i18n-ai import -c custom-config.json -i translations.csv
    `
  )
  .action(async (options) => {
    try {
      const config = loadConfig(options.config);
      await importTranslationsFromCSV(config, {
        inputPath: options.input,
        delimiter: options.delimiter,
        skipHeader: options.header !== false,
        overwrite: options.overwrite,
      });
    } catch (error) {
      console.error("Import failed:", error);
      process.exit(1);
    }
  });

program
  .command("providers")
  .description("List all available translation providers")
  .action(() => {
    const providers = getAvailableProviders();

    Object.entries(providers.models).forEach(([provider, models]) => {
      console.log(`\n${provider.toUpperCase()}:`);
      const modelList = Object.keys(models).join(" | ");
      console.log(modelList);
    });
  });

program.parse();
