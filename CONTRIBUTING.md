# Contributing to i18n-ai

First off, thank you for considering contributing to i18n-ai! It's people like you that make i18n-ai such a great tool.

## Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct. Please report unacceptable behavior to [project maintainers].

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the issue list as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

- Use a clear and descriptive title
- Describe the exact steps which reproduce the problem
- Provide specific examples to demonstrate the steps
- Describe the behavior you observed after following the steps
- Explain which behavior you expected to see instead and why
- Include error messages and stack traces
- Include your environment details (OS, Node.js version, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- Use a clear and descriptive title
- Provide a step-by-step description of the suggested enhancement
- Provide specific examples to demonstrate the steps
- Describe the current behavior and explain which behavior you expected to see instead
- Explain why this enhancement would be useful to most i18n-ai users

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. If you've changed APIs, update the documentation
4. Ensure the test suite passes
5. Make sure your code lints
6. Issue that pull request!

## Development Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/i18n-ai.git
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file with your test API keys:

   ```env
   OPENAI_API_KEY=your_test_key
   ```

4. Run tests:
   ```bash
   npm test
   ```

## Styleguides

### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line
- Consider starting the commit message with an applicable emoji:
  - 🎨 `:art:` when improving the format/structure of the code
  - 🐛 `:bug:` when fixing a bug
  - ✨ `:sparkles:` when adding a new feature
  - 📝 `:memo:` when writing docs
  - 🚀 `:rocket:` when improving performance
  - ✅ `:white_check_mark:` when adding tests
  - 🔒 `:lock:` when dealing with security

### JavaScript/TypeScript Styleguide

- Use TypeScript for new code
- Use 2 spaces for indentation
- Use semicolons
- Use meaningful variable names
- Document public APIs using JSDoc comments
- Follow the existing code style

### Documentation Styleguide

- Use [Markdown](https://guides.github.com/features/mastering-markdown/)
- Reference functions, classes, and modules in backticks
- Use code blocks for examples
- Keep line length to a maximum of 80 characters
- Use descriptive link texts

## Project Structure

```
i18n-ai/
├── src/
│   ├── providers/    # AI provider implementations
│   ├── utils/        # Utility functions
│   ├── types.ts      # TypeScript type definitions
│   └── index.ts      # Main entry point
├── tests/            # Test files
├── docs/             # Documentation
└── examples/         # Example implementations
```

## Testing

- Write tests for all new features
- Run the test suite before submitting a PR
- Aim for 100% test coverage on new code
- Use meaningful test descriptions

## Release Process

1. Update version in package.json
2. Update CHANGELOG.md
3. Create a new release on GitHub
4. Publish to npm

## Questions?

Feel free to open an issue with your question or contact the maintainers directly.

Thank you for contributing! 🚀
