# @fsegurai/manifest-generator Documentation

Welcome to the comprehensive documentation for the Manifest Generator - a powerful tool for automatically creating navigation structures and search indexes from your Markdown documentation.

## 📚 Documentation Sections

### 🚀 Getting Started
- [📖 Overview](getting-started/README.md) - Introduction and quick start
- [💾 Installation](getting-started/installation.md) - Installation methods and setup
- [👶 First Steps](getting-started/first-steps.md) - Your first manifest generation
- [🚀 Getting Started Guide](getting-started/getting-started.md) - Complete getting started tutorial

### 📚 User Guides
- [📖 Overview](guides/README.md) - Comprehensive usage guides
- [💻 CLI Usage](guides/cli-usage.md) - Complete command-line interface reference
- [⚙️ Configuration](guides/configuration.md) - Configuration options and patterns
- [🏗️ Project Structure](guides/project-structure.md) - How the tool detects projects
- [📝 Frontmatter Support](guides/frontmatter.md) - YAML frontmatter parsing

### 🔧 API Reference
- [📖 Overview](api/README.md) - Programmatic usage introduction
- [🔧 Reference](api/reference.md) - Complete API functions and methods
- [📘 TypeScript](api/typescript.md) - Type definitions and interfaces
- [💡 Examples](api/examples.md) - Practical API usage examples

### ✨ Features
- [📖 Overview](features/README.md) - Core features and capabilities
- [🔍 Search Index](features/search-index.md) - Search functionality implementation

### 🔗 Integration
- [📖 Overview](integration/README.md) - Integration guide introduction
- [🔧 Build Systems](integration/build-systems.md) - Webpack, Vite, npm scripts
- [🚀 Frameworks](integration/frameworks.md) - React, Vue, Angular, Next.js
- [⚙️ CI/CD](integration/ci-cd.md) - GitHub Actions, GitLab CI, Azure DevOps

### 💡 Examples
- [📖 Overview](examples/README.md) - Real-world usage examples
- [🚀 Basic Usage](examples/basic-usage.md) - Simple examples for beginners
- [🔧 Framework Examples](examples/frameworks.md) - Framework-specific implementations
- [⚡ Advanced Usage](examples/advanced.md) - Complex scenarios and workflows

### ❓ Help & Support
- [📖 Overview](help/README.md) - Getting help and support
- [❓ FAQ](help/faq.md) - Frequently asked questions
- [🔧 Troubleshooting](help/troubleshooting.md) - Common issues and solutions

## Quick Start

```bash
# Install globally
npm install -g @fsegurai/manifest-generator

# Or use with npx
npx @fsegurai/manifest-generator --help

# Generate manifests for all projects
npx @fsegurai/manifest-generator --all

# Process specific project
npx @fsegurai/manifest-generator --project my-docs
```

## What it Does

This tool automatically:
- 📁 **Discovers** documentation projects in your directory structure
- 📄 **Parses** Markdown files and extracts metadata from frontmatter
- 🗂️ **Builds** hierarchical navigation structures
- 🔍 **Creates** searchable indexes for documentation content
- 📤 **Outputs** clean JSON files for manifests and search data

## Use Cases

- **Documentation Sites**: Generate navigation for static site generators
- **API Documentation**: Create structured indexes for API references
- **Knowledge Bases**: Build searchable documentation systems
- **Multi-Project Docs**: Manage documentation across multiple projects
- **CI/CD Integration**: Automate documentation processing in build pipelines

## Key Features

- **Automatic Discovery**: Intelligently finds documentation in various folder structures
- **Flexible Input**: Supports both direct markdown files and docs subfolders
- **CLI & API**: Use via command line or programmatically in your code
- **Frontmatter Parsing**: Extracts metadata from YAML frontmatter
- **Search Index Generation**: Creates searchable indexes for your documentation
- **TypeScript Support**: Full TypeScript definitions included
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Multiple Output Formats**: Generates both navigation manifests and search indexes

## Navigation Guide

### New to Manifest Generator?
1. 🚀 Start with [Getting Started](getting-started/) for installation and setup
2. 📚 Read the [User Guides](guides/) for detailed usage instructions
3. 💡 Check [Basic Examples](examples/basic-usage.md) for simple use cases

### Ready to Integrate?
1. 🔧 Explore [API Reference](api/) for programmatic usage
2. 🔗 Check [Integration](integration/) for build system setup
3. 💡 Browse [Framework Examples](examples/frameworks.md) for your tech stack

### Need Help?
1. ❓ Check the [FAQ](help/faq.md) for common questions
2. 🔧 Review [Troubleshooting](help/troubleshooting.md) for common issues
3. 🐛 Open an issue on GitHub for bugs or feature requests

## Contributing

We welcome contributions! Please see our [Contributing Guide](../../../CONTRIBUTING.md) for details on how to:
- Report bugs
- Suggest features
- Submit pull requests
- Improve documentation

## License

This project is licensed under the MIT License - see the [LICENSE](../../../LICENSE) file for details.
