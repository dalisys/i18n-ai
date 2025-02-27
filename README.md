# i18n-ai

[![npm version](https://badge.fury.io/js/i18n-ai.svg)](https://www.npmjs.com/package/i18n-ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Downloads](https://img.shields.io/npm/dt/i18n-ai.svg)](https://www.npmjs.com/package/i18n-ai)
[![GitHub stars](https://img.shields.io/github/stars/dalisys/i18n-ai.svg?style=social&label=Star)](https://github.com/dalisys/i18n-ai)

AI-powered translation tool for i18n JSON files. Translates while preserving nested structure, supports multiple AI providers, and offers CSV import/export for easy management.

## Features

- 🤖 Multiple AI providers: OpenAI, Anthropic, Gemini, DeepSeek, XAI
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

# List available models
npx i18n-ai models
npx i18n-ai models --provider openai

# Export translations to CSV
npx i18n-ai export --output ./exports/translations.csv

# Import translations from CSV
npx i18n-ai import -i ./data/translations.csv
```

## Configuration Options

| Option        | Description                                | Default          |
| ------------- | ------------------------------------------ | ---------------- |
| `source.path` | Path to source language file               | Required         |
| `source.code` | Source language code                       | Required         |
| `targets`     | Array of target language configurations    | Required         |
| `provider`    | AI provider (`openai`, `anthropic`, etc.)  | `openai`         |
| `model`       | Model name for selected provider           | Provider default |
| `chunkSize`   | Number of keys per translation chunk       | 50               |
| `concurrency` | Number of concurrent translation requests  | 3                |
| `overwrite`   | Whether to overwrite existing translations | false            |
| `description` | Project context for better translations    | -                |
| `tone`        | Desired tone (e.g., "formal", "casual")    | -                |
| `ignoreKeys`  | Array of keys to ignore during translation | -                |

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

### CSV Import/Export Options

```json
{
  "export": {
    "outputPath": "./exports/translations.csv",
    "delimiter": ";",
    "includeMetadata": true
  }
}
```

## Programmatic Usage

```typescript
import {
  translateFiles,
  exportTranslationsToCSV,
  importTranslationsFromCSV,
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
  includeMetadata: false,
});

// CSV Import
await importTranslationsFromCSV(config, {
  inputPath: "./imports/translations.csv",
  delimiter: ",",
  skipHeader: true,
  overwrite: false,
});
```

## Support the Project

If you find this package useful, please consider:

- ⭐ Giving it a star on GitHub: https://github.com/dalisys/i18n-ai
- 🔧 Contributing with bug reports, feature requests, or pull requests
- 📣 Sharing it with other developers who might find it helpful

Contributions of all kinds are welcome!

## License

MIT
