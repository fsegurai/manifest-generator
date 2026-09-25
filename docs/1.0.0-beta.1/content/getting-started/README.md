---
title: Getting Started Overview
description: Introduction to the Manifest Generator and quick start guide
tags: ["getting-started", "overview", "introduction"]
---

# Getting Started

Welcome to the **Manifest Generator**! This section will help you get up and running quickly by showing you how to generate documentation manifests and search indexes from your Markdown files.

---

## 📚 Quick Navigation

This section contains everything you need to start using Manifest Generator:

- [📖 **Overview**](./README.md) - You are here
- [💾 **Installation**](installation.md) - All installation methods and setup options
- [👶 **First Steps**](first-steps.md) - Step-by-step tutorial for your first manifest
- [🚀 **Getting Started Guide**](getting-started.md) - Comprehensive getting started tutorial

---

## 🎯 What You'll Learn

In this section, you'll discover:

- ✅ **Installation Methods** - npx, global install, and project dependency options
- ✅ **Basic Concepts** - How manifests and search indexes work
- ✅ **Quick Examples** - Get started in minutes with practical examples
- ✅ **Common Patterns** - Best practices for organizing your documentation
- ✅ **First Project** - Create your first manifest step-by-step
- ✅ **Next Steps** - Where to go after mastering the basics

---

## 📋 Prerequisites

Before you begin, make sure you have:

### Required
- ✅ **Node.js 14+** installed on your system ([Download Node.js](https://nodejs.org/))
- ✅ **Markdown files** (`.md` extension) with your documentation
- ✅ **Basic command line** knowledge (running commands in terminal)

### Optional but Helpful
- 📦 **npm, yarn, pnpm, or bun** - Package manager (npm comes with Node.js)
- 📝 **Text editor** - VS Code, Sublime, or any editor you prefer
- 🔧 **Git** - For version control (optional)

### Check Your Setup

Verify Node.js is installed:

```bash
node --version  # Should show v14.0.0 or higher
npm --version   # Should show 6.0.0 or higher
```

---

## ⚡ Quick Start

If you're in a hurry, here's the fastest way to get started:

### One-Line Quick Start

```bash
# Process documentation in the current directory
npx @fsegurai/manifest-generator --route ./docs
```

This single command will:
- 📥 Download and run the latest version (no installation!)
- 🔍 Scan your `./docs` folder for Markdown files
- 🗂️ Generate `manifest.json` (navigation structure)
- 🔎 Generate `search-index.json` (searchable content)

### For Monorepos or Multiple Projects

```bash
# Process all documentation projects automatically
npx @fsegurai/manifest-generator --all
```

This will discover and process all projects in your workspace.

---

## 🗺️ Learning Path

Follow this recommended path for the best learning experience:

### 1️⃣ **Installation** (5 minutes)
Start here: [Installation Guide](installation.md)

Choose your preferred installation method:
- **npx** - No installation, perfect for trying out
- **Global** - Install once, use anywhere
- **Project dependency** - Best for teams and CI/CD

### 2️⃣ **First Steps** (10 minutes)
Continue to: [First Steps Guide](first-steps.md)

Create your first manifest with a hands-on tutorial:
- Set up a simple documentation structure
- Run the generator
- Understand the output files
- Make basic customizations

### 3️⃣ **Complete Tutorial** (20 minutes)
Deep dive: [Getting Started Guide](getting-started.md)

Learn everything you need to know:
- All installation options in detail
- Adding rich metadata with frontmatter
- Working with multiple projects
- Build system integration
- Next steps and advanced features

---

## 🎓 After Getting Started

Once you've completed the getting started section, explore these areas:

### For CLI Users
- 💻 [**CLI Usage Guide**](../guides/cli-usage.md) - All command-line options
- ⚙️ [**Configuration**](../guides/configuration.md) - Customize behavior
- 🏗️ [**Project Structure**](../guides/project-structure.md) - How discovery works

### For Developers
- 🔧 [**API Reference**](../api/reference.md) - Programmatic usage
- 📘 [**TypeScript Guide**](../api/typescript.md) - Type definitions
- 💡 [**API Examples**](../api/examples.md) - Code examples

### For Integration
- 🔗 [**Build Systems**](../integration/build-systems.md) - Webpack, Vite, Rollup
- 🎨 [**Frameworks**](../integration/frameworks.md) - React, Vue, Angular
- ⚙️ [**CI/CD**](../integration/ci-cd.md) - Automate in pipelines

### For Inspiration
- 💡 [**Examples**](../examples/README.md) - Real-world usage patterns
- 🚀 [**Basic Usage**](../examples/basic-usage.md) - Simple scenarios
- ⚡ [**Advanced Usage**](../examples/advanced.md) - Complex patterns

---

## 💡 Key Concepts

Before diving in, understand these core concepts:

### 📄 Manifest
A JSON file containing the hierarchical structure of your documentation. Used to build navigation menus, sidebars, and table of contents.

### 🔍 Search Index
A JSON file containing searchable content from your documentation. Used to implement search functionality.

### 📝 Frontmatter
YAML metadata at the top of Markdown files:
```markdown
---
title: My Page
tags: ["guide", "api"]
---
```

### 🗂️ Project Discovery
Automatic detection of documentation projects based on folder structure and naming conventions.

---

## ❓ Need Help?

Get assistance when you need it:

- 📖 [**FAQ**](../help/faq.md) - Common questions and answers
- 🔧 [**Troubleshooting**](../help/troubleshooting.md) - Solve common issues
- 💬 [**GitHub Discussions**](https://github.com/fsegurai/manifest-generator/discussions) - Community support
- 🐛 [**Report Issues**](https://github.com/fsegurai/manifest-generator/issues) - Bug reports and feature requests

---

## 🚀 Ready to Start?

Choose your path:

- 👉 **New users**: Start with [Installation](installation.md)
- 👉 **Quick learners**: Jump to [First Steps](first-steps.md)
- 👉 **Want everything**: Read the [Getting Started Guide](getting-started.md)
- 👉 **Just exploring**: Check out [Examples](../examples/basic-usage.md)

Let's get started! 🎉
- 💬 Review [troubleshooting](../help/troubleshooting.md) guides
- 📖 Read the complete [documentation](../README.md)
