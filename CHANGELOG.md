# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.1] - 2025-03-05

### Fixed

- Fixed `unflattenObject` utility to properly preserve objects with numeric keys
- Enhanced test coverage for numeric key handling in object transformations

### Changed

- Enhanced error handling: now preserves and applies already translated chunks when errors occur
- Detailed error reporting showing which chunk failed and improved error messages

### Added

- New `stopOnError` option to control whether the process stops on first error or continues with other languages

## [1.3.1] - 2025-02-24

### Added

- Enhanced test coverage with additional unit tests
- Improved build configuration and optimization

## [1.3.0] - 2025-02-23

### Added

- CSV import/export functionality
  - New `import` command to update translations from CSV files
  - New `export` command to export translations to CSV format
  - Support for custom delimiters and headers
  - Metadata export option (last modified date)
  - Configuration options in `translator.config.json` for import/export settings
  - Validation of CSV structure against configured languages
  - Lightweight CSV parser implementation (no external dependencies)
  - Programmatic API for import/export operations
- Added spinner to the CLI

### Enhanced

- Documentation improvements
  - Added CSV import/export usage examples
  - Updated configuration documentation
  - Added new CLI commands reference

## [1.2.0] - 2025-02-21

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

[1.4.1]: https://github.com/dalisys/i18n-ai/compare/v1.3.1...v1.4.1
[1.3.1]: https://github.com/dalisys/i18n-ai/compare/v1.3.0...v1.3.1
[1.3.0]: https://github.com/dalisys/i18n-ai/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/dalisys/i18n-ai/compare/v1.0.0...v1.2.0
[1.0.0]: https://github.com/dalisys/i18n-ai/releases/tag/v1.0.0
