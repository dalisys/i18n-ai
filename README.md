# i18n-ai

[![npm version](https://badge.fury.io/js/i18n-ai.svg)](https://www.npmjs.com/package/i18n-ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Downloads](https://img.shields.io/npm/dt/i18n-ai.svg)](https://www.npmjs.com/package/i18n-ai)
[![GitHub stars](https://img.shields.io/github/stars/dalisys/i18n-ai.svg?style=social&label=Star)](https://github.com/dalisys/i18n-ai)

An AI-powered translation tool for i18n JSON files. This package helps you automatically translate your internationalization files using AI language models while handling large files through intelligent chunking.
Lightweight and fast.

Support us by starring the repository! 🌟🌟🌟

## Table of Contents

- [i18n-ai](#i18n-ai)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Quick Start](#quick-start)
  - [Configuration](#configuration)
    - [Basic Options](#basic-options)
    - [Advanced Options](#advanced-options)
    - [Export Configuration](#export-configuration)
    - [Translation Context and Tone](#translation-context-and-tone)
    - [Chunk Size vs. All-at-Once](#chunk-size-vs-all-at-once)
    - [Ignoring Keys](#ignoring-keys)
    - [Complete Configuration Example](#complete-configuration-example)
  - [Usage](#usage)
    - [CLI Commands](#cli-commands)
    - [CSV Import/Export](#csv-importexport)
      - [Importing Translations from CSV](#importing-translations-from-csv)
      - [Exporting Translations to CSV](#exporting-translations-to-csv)
    - [Other CLI Commands](#other-cli-commands)
    - [Programmatic Usage](#programmatic-usage)
  - [Configuration Options](#configuration-options)
    - [Overwrite Option](#overwrite-option)
      - [When `overwrite: false` (default):](#when-overwrite-false-default)
      - [When `overwrite: true`:](#when-overwrite-true)
    - [Using Custom Models](#using-custom-models)
  - [Supported AI Providers and Models](#supported-ai-providers-and-models)
  - [Troubleshooting](#troubleshooting)
    - [Common Issues](#common-issues)
    - [Error Messages](#error-messages)
  - [Security](#security)
  - [Contributing](#contributing)
  - [Changelog](#changelog)
  - [License](#license)

## Features

- 🚀 Efficient handling of large i18n files through chunking
- 🔄 Multiple AI providers support (OpenAI, Anthropic, Gemini, DeepSeek, XAI)
- 🎯 Preserves JSON structure and nested keys
- ⚙️ Smart handling of existing translations
- 🔍 Detailed progress tracking and statistics
- 💾 Automatic retry on API failures
- 🛡️ Type-safe configuration
- 🤖 Configurable AI models for each provider
- 📋 Up-to-date model information and deprecation warnings
- 🔓 Support for custom model names
- 🎨 Customizable translation tone and context
- ⚡ Option to translate entire files at once
- 📊 Export translations to CSV for review and analysis
- 📝 Import translations from CSV

## Quick Start

1. Install the package:

```bash
npm install --save-dev i18n-ai
# or
yarn add -D i18n-ai
```

2. Create a basic config file (`translator.config.json`):

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

3. Set up your API key in `.env`:

```env
OPENAI_API_KEY=your_api_key_here
```

4. Run the translation:

```bash
npx i18n-ai translate
```

## Configuration

### Basic Options

| Option           | Description                                                             | Default          |
| ---------------- | ----------------------------------------------------------------------- | ---------------- |
| `source`         | Source language file configuration                                      | Required         |
| `source.path`    | Path to source language file                                            | Required         |
| `source.code`    | Source language code                                                    | Required         |
| `targets`        | Array of target language configurations                                 | Required         |
| `targets[].path` | Path to target language file                                            | Required         |
| `targets[].code` | Target language code                                                    | Required         |
| `provider`       | AI provider to use (`openai`, `anthropic`, `gemini`, `deepseek`, `xai`) | `openai`         |
| `model`          | Model to use for the selected provider                                  | Provider default |

### Advanced Options

| Option               | Description                                            | Default |
| -------------------- | ------------------------------------------------------ | ------- |
| `chunkSize`          | Number of keys per translation chunk                   | 50      |
| `concurrency`        | Number of concurrent translation requests              | 3       |
| `overwrite`          | Whether to overwrite existing translations             | false   |
| `description`        | Project context for better translations                | -       |
| `tone`               | Desired tone (e.g., "formal", "casual", "technical")   | -       |
| `translateAllAtOnce` | Translate entire file in one request instead of chunks | false   |
| `ignoreKeys`         | Array of keys to ignore during translation             | -       |
| `export`             | CSV export configuration (see below)                   | -       |

### Export Configuration

The `export` section in your config file allows you to set default options for CSV exports:

| Option            | Description                                     | Default                   |
| ----------------- | ----------------------------------------------- | ------------------------- |
| `outputPath`      | Path where the CSV file will be saved           | ./translations-export.csv |
| `delimiter`       | Character to use as CSV delimiter               | ,                         |
| `includeMetadata` | Include last modified date for each translation | false                     |

Example configuration with export options:

```json
{
  "source": {
    "path": "./locales/en.json",
    "code": "en"
  },
  "targets": [
    {
      "path": "./locales/de.json",
      "code": "de"
    }
  ],
  "provider": "openai",
  "export": {
    "outputPath": "./exports/translations.csv",
    "delimiter": ";",
    "includeMetadata": true
  }
}
```

Note: CLI arguments (`--output`, `--delimiter`, `--metadata`) will override these config file settings.

### Translation Context and Tone

You can improve translation quality by providing context and tone:

```json
{
  "description": "A business dashboard application with professional terminology",
  "tone": "formal"
}
```

### Chunk Size vs. All-at-Once

Choose between chunked translation or all-at-once:

```json
{
  "chunkSize": 100, // Larger chunks for fewer API calls
  "translateAllAtOnce": true // Optional: translate everything at once
}
```

Note: All-at-once translation might hit token limits for large files.

### Ignoring Keys

You can exclude specific keys and their nested children from translation using the `ignoreKeys` option:

```json
{
  "ignoreKeys": [
    "app.constants", // Ignores all application constants
    "validation.regex", // Ignores regex patterns
    "errors.codes" // Ignores error codes that should stay the same
  ]
}
```

When a key is ignored:

- If it exists in the target file, that translation will be kept
- If it doesn't exist in the target file, the source value will be used
- All child keys of an ignored key will also be ignored
- The skipped keys count will include ignored keys

### Complete Configuration Example

Here's a comprehensive example showing all available options:

```json
{
  "source": {
    "path": "./locales/en.json",
    "code": "en"
  },
  "targets": [
    {
      "path": "./locales/de.json",
      "code": "de"
    },
    {
      "path": "./locales/fr.json",
      "code": "fr"
    }
  ],
  "provider": "openai",
  "model": "gpt-4-turbo-preview",
  "chunkSize": 50,
  "concurrency": 3,
  "overwrite": false,
  "description": "A business dashboard application with professional terminology",
  "tone": "formal",
  "translateAllAtOnce": false,
  "ignoreKeys": [
    "app.constants.apiEndpoints",
    "app.constants.httpStatus",
    "validation.regex.email"
  ],
  "export": {
    "outputPath": "./exports/translations.csv",
    "delimiter": ";",
    "includeMetadata": true
  }
}
```

## Usage

### CLI Commands

Translate using configuration file:

```bash
npx i18n-ai translate
```

### CSV Import/Export

#### Importing Translations from CSV

You can import translations from a CSV file using the `import` command:

```bash
# Basic usage
i18n-ai import -i translations.csv

# Custom options
i18n-ai import -i ./data/translations.csv -d ";" --no-header --overwrite
```

The CSV file should follow this structure:

```csv
key,en,es,fr
welcome.title,Welcome,Bienvenido,Bienvenue
welcome.subtitle,Get started,Empezar,Commencer
```

Import Options:

- `-i, --input <path>`: Input CSV file path (required)
- `-d, --delimiter <char>`: CSV delimiter (default: ',')
- `--no-header`: Skip header row in CSV
- `-o, --overwrite`: Overwrite existing translations
- `-c, --config <path>`: Custom config file path

You can also configure import settings in your `translator.config.json`:

```json
{
  "import": {
    "delimiter": ",",
    "skipHeader": true,
    "overwrite": false
  }
}
```

#### Exporting Translations to CSV

Export your translations to CSV for review or backup:

```bash
# Basic usage (creates translations-export.csv)
i18n-ai export

# Custom options
i18n-ai export --output ./exports/translations.csv --delimiter ";" --metadata
```

Export Options:

- `-o, --output <path>`: Output file path (default: './translations-export.csv')
- `-d, --delimiter <char>`: CSV delimiter (default: ',')
- `-m, --metadata`: Include metadata columns (e.g., last modified date)
- `-c, --config <path>`: Custom config file path

Configure default export settings in your `translator.config.json`:

```json
{
  "export": {
    "outputPath": "./exports/translations.csv",
    "delimiter": ";",
    "includeMetadata": true
  }
}
```

The exported CSV will have this structure:

```csv
Key,en,de,fr,Last Modified
common.welcome,Welcome,Willkommen,Bienvenue,2024-03-21T10:30:00.000Z
common.login,Log in,Anmelden,Se connecter,2024-03-21T10:30:00.000Z
errors.required,This field is required,Dieses Feld ist erforderlich,Ce champ est obligatoire,2024-03-21T10:30:00.000Z
```

This format makes it easy to:

- Review translations across all languages
- Import into spreadsheet software for analysis
- Share with translators or stakeholders for review
- Track changes through metadata

### Other CLI Commands

Use a custom config file:

```bash
npx i18n-ai translate --config custom-config.json
```

Force overwrite existing translations:

```bash
npx i18n-ai translate --overwrite
```

List all available models:

```bash
npx i18n-ai models
```

List models for a specific provider:

```bash
npx i18n-ai models --provider openai
```

The models command will show detailed information about each model:

```
OPENAI Models:
----------------------------------------
- GPT-3.5 Turbo (default)
  ID: gpt-3.5-turbo
  Max Tokens: 4,096

- GPT-4
  ID: gpt-4
  Max Tokens: 8,192

- GPT-4 Turbo
  ID: gpt-4-turbo-preview
  Max Tokens: 128,000
```

### Programmatic Usage

```typescript
import {
  translateFiles,
  exportTranslationsToCSV,
  importTranslationsFromCSV,
} from "i18n-ai";

// Translation
await translateFiles({
  configPath: "./custom-config.json", // optional
  overwrite: false, // optional
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

## Configuration Options

| Option           | Description                                                             | Default          |
| ---------------- | ----------------------------------------------------------------------- | ---------------- |
| `source`         | Source language file configuration                                      | Required         |
| `source.path`    | Path to source language file                                            | Required         |
| `source.code`    | Source language code                                                    | Required         |
| `targets`        | Array of target language configurations                                 | Required         |
| `targets[].path` | Path to target language file                                            | Required         |
| `targets[].code` | Target language code                                                    | Required         |
| `provider`       | AI provider to use (`openai`, `anthropic`, `gemini`, `deepseek`, `xai`) | `openai`         |
| `model`          | Model to use for the selected provider (see below)                      | Provider default |
| `chunkSize`      | Maximum characters per translation request                              | 50               |
| `concurrency`    | Number of concurrent translation requests                               | 3                |
| `overwrite`      | Whether to overwrite existing translations (see below)                  | false            |

### Overwrite Option

The `overwrite` option controls how the tool handles existing translations in your target files:

#### When `overwrite: false` (default):

- Preserves existing translations in target files
- Only translates new or missing keys
- Skips keys that already have translations
- Useful for:
  - Incrementally translating new content
  - Preserving manually reviewed translations
  - Saving API costs by not re-translating existing content

#### When `overwrite: true`:

- Re-translates all keys, regardless of existing translations
- Overwrites any existing translations with new ones
- No keys are skipped
- Useful for:
  - Re-translating everything from scratch
  - Updating translations with a different/better model
  - Fixing poor quality translations in bulk

You can set this option in three ways:

1. In your config file (`translator.config.json`):

```json
{
  "overwrite": true
  // ... other options
}
```

2. Via CLI flag (overrides config file):

```bash
npx i18n-ai translate --overwrite
```

3. Programmatically (overrides config file):

```typescript
await translateFiles({
  overwrite: true,
});
```

The translation summary will show you:

- Total number of keys processed
- Number of new translations created
- Number of skipped existing translations (when overwrite is false)
- Any errors encountered

### Using Custom Models

You can specify any model name in the configuration, even if it's not in our predefined list. This is useful for:

- Using newer models that we haven't added yet
- Using older models that you still have access to
- Using private or fine-tuned models

Example:

```json
{
  "provider": "openai",
  "model": "your-custom-model-name"
  // ... other config options
}
```

Note: When using a custom model name, make sure it exists in your provider's API. The tool will warn you that you're using an unverified model but will attempt to use it anyway.

## Supported AI Providers and Models

Use the `models` command to get the most up-to-date list of supported models and their capabilities:

```bash
npx i18n-ai models
```

Example output:

```
OPENAI Models:
----------------------------------------
- GPT-4o-mini (default)
  ID: gpt-4o-mini
  Max Tokens: 4,096

- GPT-4
  ID: gpt-4
  Max Tokens: 8,192

- GPT-4 Turbo
  ID: gpt-4-turbo-preview
  Max Tokens: 128,000

ANTHROPIC Models:
----------------------------------------
- Claude 3 Opus
  ID: claude-3-opus-20240229
  Max Tokens: 200,000

- Claude 3 Haiku (default)
  ID: claude-3-haiku-20240307
  Max Tokens: 200,000

...
```

The tool will automatically warn you about deprecated models and suggest alternatives when applicable.

## Troubleshooting

### Common Issues

1. **API Key Errors**

   - Ensure your API key is correctly set in the .env file
   - Check if the API key has sufficient permissions

2. **Token Limits**

   - Reduce `chunkSize` if hitting token limits
   - Consider using `translateAllAtOnce: false` for large files

3. **Translation Quality**
   - Use `description` and `tone` to improve context
   - Try different models or providers
   - Consider breaking down large objects into smaller chunks

### Error Messages

- "API key not found": Set the appropriate environment variable
- "Source file not found": Check file paths in config
- "Invalid JSON": Ensure source files are valid JSON

## Security

- Never commit API keys to version control
- Use environment variables for sensitive data
- Consider using API key rotation
- Review provider-specific security guidelines

## Contributing

1. Fork the repository [https://github.com/dalisys/i18n-ai.git](https://github.com/dalisys/i18n-ai.git)
2. Create your feature branch
3. Run tests: `npm test`
4. Submit a pull request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for release history.

## License

MIT
