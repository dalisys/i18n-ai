# i18n-ai

[![npm version](https://badge.fury.io/js/i18n-ai.svg)](https://www.npmjs.com/package/i18n-ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Downloads](https://img.shields.io/npm/dt/i18n-ai.svg)](https://www.npmjs.com/package/i18n-ai)
[![GitHub stars](https://img.shields.io/github/stars/dalisys/i18n-ai.svg?style=social&label=Star)](https://github.com/dalisys/i18n-ai)

AI-powered translation tool for i18n JSON files. Translates while preserving nested structure, supports multiple AI providers, and offers CSV import/export for easy management.

## Features

- 🤖 Multiple AI providers: OpenAI, Anthropic, Gemini, DeepSeek, XAI
- 🔌 Support for custom translation API endpoints
- 🔄 Preserves JSON structure and handles large files with chunking
- 🔧 Customizable translation settings (models, tone, context)
- 📊 CSV import/export for reviewing translations
- ⚙️ Smart handling of existing translations

## Installation

```bash
npm install --save-dev i18n-ai
# or
yarn add -D i18n-ai
```

## Quick Start

1. Create a config file (`translator.config.json`):

```json
{
  "source": {
    "path": "./locales/en.json",
    "code": "en"
  },
  "targets": [
    {
      "path": "./locales/es.json",
      "code": "es"
    }
  ],
  "provider": "openai"
}
```

2. Set up your API key in `.env`:

```env
OPENAI_API_KEY=your_api_key_here
```

3. Run the translation:

```bash
npx i18n-ai translate
```

## Basic CLI Commands

```bash
# Translate using config file
npx i18n-ai translate

# Use custom config
npx i18n-ai translate --config custom-config.json

# Force overwrite existing translations
npx i18n-ai translate --overwrite

# List available providers and their details
npx i18n-ai providers

# List available models
npx i18n-ai models
npx i18n-ai models --provider openai

# Export translations to CSV
npx i18n-ai export --output ./exports/translations.csv

# Import translations from CSV
npx i18n-ai import -i ./data/translations.csv
```

## Configuration Options

| Option           | Description                                | Default          |
| ---------------- | ------------------------------------------ | ---------------- |
| `source.path`    | Path to source language file               | Required         |
| `source.code`    | Source language code                       | Required         |
| `targets`        | Array of target language configurations    | Required         |
| `provider`       | AI provider (`openai`, `anthropic`, etc.)  | `openai`         |
| `model`          | Model name for selected provider           | Provider default |
| `chunkSize`      | Number of keys per translation chunk       | 50               |
| `concurrency`    | Number of concurrent translation requests  | 3                |
| `overwrite`      | Whether to overwrite existing translations | false            |
| `description`    | Project context for better translations    | -                |
| `tone`           | Desired tone (e.g., "formal", "casual")    | -                |
| `ignoreKeys`     | Array of keys to ignore during translation | -                |
| `customProvider` | Configuration for a custom translation API | -                |

## Advanced Usage

### Translation Context and Tone

```json
{
  "description": "A business dashboard application with professional terminology",
  "tone": "formal"
}
```

### Ignoring Keys

```json
{
  "ignoreKeys": ["app.constants", "validation.regex"]
}
```

### Using a Custom Translation Provider

You can integrate with any translation API by configuring a custom provider. With this approach, you take full control of the request format and authentication:

```json
{
  "customProvider": {
    "url": "https://api.your-translation-service.com/translate",
    "method": "POST",
    "headers": {
      "Content-Type": "application/json",
      "Authorization": "Bearer YOUR_API_KEY_HERE",
      "X-Custom-Header": "value"
    },
    "body": {
      "text": "{{text}}",
      "source": "{{sourceLang}}",
      "target": "{{targetLang}}",
      "format": "json"
    },
    "responsePath": "data.translations[0].translatedText"
  }
}
```

When `customProvider` is specified, it takes precedence over the regular provider setting.

#### Configuration Options:

| Option         | Description                                    | Default        |
| -------------- | ---------------------------------------------- | -------------- |
| `url`          | API endpoint URL                               | Required       |
| `method`       | HTTP method (GET or POST)                      | POST           |
| `headers`      | HTTP headers (including your auth headers)     | {}             |
| `body`         | Request body template with placeholders        | Default format |
| `responsePath` | JSON path to extract translation from response | -              |

#### How It Works:

1. **Request Body**: The package will replace these placeholders in your request body:

   - `{{text}}` - The text to translate
   - `{{sourceLang}}` - The source language code
   - `{{targetLang}}` - The target language code

2. **Response Handling**:

   - If `responsePath` is specified, the package will extract the translation using that path
   - If not specified, the entire response body will be treated as the translation

3. **Error Logging**:

   - When errors occur with the custom provider, detailed logs are automatically created
   - Log files are saved in the `i18n_ai_logs` directory at the root of your project

### CSV Import/Export Options

```json
{
  "export": {
    "outputPath": "./exports/translations.csv",
    "delimiter": ";"
  }
}
```

## Programmatic Usage

```typescript
import {
  translateFiles,
  exportTranslationsToCSV,
  importTranslationsFromCSV,
  getAvailableProviders,
} from "i18n-ai";

// Translation
await translateFiles({
  configPath: "./custom-config.json",
  overwrite: false,
});

// CSV Export
await exportTranslationsToCSV(config, {
  outputPath: "./exports/translations.csv",
  delimiter: ",",
});

// CSV Import
await importTranslationsFromCSV(config, {
  inputPath: "./imports/translations.csv",
  delimiter: ",",
  skipHeader: true,
  overwrite: false,
});

// Get available providers and models
const providers = getAvailableProviders();
console.log("Available providers:", providers.providers);
console.log("Default model for OpenAI:", providers.defaultModels.openai);
console.log("All OpenAI models:", Object.keys(providers.models.openai));
```

## Supported Providers

The package currently supports the following AI providers:

- **OpenAI** (API key: `OPENAI_API_KEY`)
- **Anthropic** (API key: `ANTHROPIC_API_KEY`)
- **Gemini** (API key: `GEMINI_API_KEY`)
- **DeepSeek** (API key: `DEEPSEEK_API_KEY`)
- **XAI** (API key: `XAI_API_KEY`)
- **Custom** (Define your own translation API endpoint)

You can get a list of all supported providers and their models using the `getAvailableProviders()` function or the `providers` CLI command.

## Support the Project

If you find this package useful, please consider:

- ⭐ Giving it a star on GitHub: https://github.com/dalisys/i18n-ai
- 🔧 Contributing with bug reports, feature requests, or pull requests
- 📣 Sharing it with other developers who might find it helpful

Contributions of all kinds are welcome!

## License

MIT
