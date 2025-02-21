# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2024-03-21

### Enhanced

- Improved translation processing with batch processing and enhanced parsing capabilities
- Added rate limiting and error handling to Anthropic provider
- Enhanced JSON response format handling for DeepSeek and OpenAI providers
- Improved Gemini provider response handling

## [1.0.0] - 2025-02-20

### Added

- Initial release
- Support for OpenAI, Anthropic, and Gemini providers
- Smart chunking for large files
- CLI and programmatic interfaces
- Type-safe configuration
- Existing translation handling
- Custom model support
- Basic progress tracking
- Support for `translateAllAtOnce` option to translate entire files in one request
- Customizable translation tone and context through `tone` and `description` options
- Support for DeepSeek and XAI providers
- Detailed progress tracking and statistics
- Automatic retry on API failures

[Unreleased]: https://github.com/yourusername/i18n-ai/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/yourusername/i18n-ai/compare/v1.0.0...v1.2.0
[1.0.0]: https://github.com/yourusername/i18n-ai/releases/tag/v1.0.0
