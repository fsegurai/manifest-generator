---
title: Getting Started with Manifest Generator
description: Complete guide to getting started with the Manifest Generator library
tags: ["getting-started", "installation", "tutorial", "quickstart"]
---

# Getting Started

Welcome to the Manifest Generator! This comprehensive guide will help you get up and running quickly with automatic documentation manifest generation.

## 🎯 What is Manifest Generator?

**Manifest Generator** is a powerful, zero-dependency tool that automatically creates navigation structures and search indexes from your Markdown documentation. It's designed to help you build better documentation sites by automatically organizing your content into structured JSON files that can be consumed by documentation frameworks, static site generators, or custom applications.

### Key Capabilities

- 📁 **Automatic Discovery** - Finds documentation projects in various directory structures
- 🗂️ **Hierarchical Navigation** - Builds nested menu structures from folder hierarchies
- 🔍 **Search Indexes** - Generates searchable content indexes automatically
- 📝 **Metadata Extraction** - Parses YAML frontmatter for titles, tags, descriptions, and more
- 🎨 **Rich Metadata** - Supports icons, badges, colors, and custom properties
- 🚀 **Zero Config** - Works out of the box with sensible defaults

---

## 📦 Installation

Choose the installation method that best fits your workflow:

### Using npx (Recommended for Trying Out)

No installation required! Perfect for trying out the tool or one-time use:

```bash
    "label": "README",
    "route": "README",

# Process your documentation immediately
npx @fsegurai/manifest-generator --route ./docs
    "label": "Getting Started",
    "route": "getting-started",
npx @fsegurai/manifest-generator --all
```

    "label": "Api",
- ✅ No installation needed
- ✅ Always uses the latest version
        "label": "Reference",
        "route": "api/reference",
### Global Installation (Recommended for Frequent Use)

Install once and use anywhere on your system:

```bash
# Install globally
npm install -g @fsegurai/manifest-generator

# Or with Yarn
yarn global add @fsegurai/manifest-generator

# Or with pnpm
pnpm add -g @fsegurai/manifest-generator

# Or with Bun
bun add -g @fsegurai/manifest-generator
```

After installation, use directly:

```bash
manifest-generator --help
manifest-generator --all
```

**Advantages:**
- ✅ Faster execution (no download time)
- ✅ Works offline
- ✅ Shorter command

### Project Dependency (Recommended for Projects)

Add to your project for team collaboration and reproducible builds:

```bash
# As a dev dependency (recommended for most projects)
npm install --save-dev @fsegurai/manifest-generator

# Or with Yarn
yarn add --dev @fsegurai/manifest-generator

# Or with pnpm
pnpm add -D @fsegurai/manifest-generator

# Or with Bun
bun add -d @fsegurai/manifest-generator
```

Then add scripts to your `package.json`:

```json
{
  "scripts": {
    "docs:generate": "manifest-generator --all",
    "docs:watch": "chokidar 'docs/**/*.md' -c 'npm run docs:generate'",
    "build": "npm run docs:generate && npm run build:app"
  }
}
```

**Advantages:**
- ✅ Version pinning for reproducible builds
- ✅ Team members get the same version
- ✅ Works in npm scripts
- ✅ CI/CD friendly

---

## 🚀 Your First Manifest

Let's create your first documentation manifest in 3 simple steps:

### Step 1: Prepare Your Documentation

Create a simple documentation structure:

```
my-project/
├── docs/
│   ├── README.md
│   ├── getting-started.md
│   └── api/
│       ├── overview.md
│       └── functions.md
└── package.json
```

Add some basic content to each file:

**docs/README.md:**
```markdown
---
title: Documentation Home
description: Welcome to our documentation
tags: ["home", "overview"]
---

# Documentation

Welcome to the project documentation!
```

**docs/getting-started.md:**
```markdown
---
title: Getting Started
description: Quick start guide
tags: ["tutorial", "beginner"]
---

# Getting Started

Follow these steps to get started...
```

**docs/api/overview.md:**
```markdown
---
title: API Overview
description: Overview of the API
tags: ["api", "reference"]
---

# API Overview

This section covers our API...
```

### Step 2: Generate Manifests

Navigate to your project directory and run:

```bash
# Using npx (no installation)
npx @fsegurai/manifest-generator --route ./docs

# Or if installed globally
manifest-generator --route ./docs

# Or with npm script
npm run docs:generate
```

### Step 3: Check the Output

The tool creates two files in your docs directory:

**docs/manifest.json** - Navigation structure:
```json
[
  {
    "label": "Documentation Home",
    "description": "Welcome to our documentation",
    "route": "README",
    "tags": ["home", "overview"]
  },
  {
    "label": "Getting Started",
    "description": "Quick start guide",
    "route": "getting-started",
    "tags": ["tutorial", "beginner"]
  },
  {
    "label": "Api",
    "route": "api",
    "isParent": true,
    "children": [
      {
        "label": "API Overview",
        "description": "Overview of the API",
        "route": "api/overview",
        "tags": ["api", "reference"]
      },
      {
        "label": "Functions",
        "route": "api/functions",
        "tags": []
      }
    ]
  }
]
```

**docs/search-index.json** - Searchable content:
```json
[
  {
    "label": "Documentation Home",
    "description": "Welcome to our documentation",
    "route": "README",
    "tags": ["home", "overview"]
  },
  {
    "label": "Getting Started",
    "description": "Quick start guide",
    "route": "getting-started",
    "tags": ["tutorial", "beginner"]
  },
  {
    "label": "API Overview",
    "description": "Overview of the API",
    "route": "api/overview",
    "tags": ["api", "reference"]
  }
]
```

---

## 🎉 Success!

Congratulations! You've successfully generated your first documentation manifest. The generated JSON files can now be used to power:

- 🧭 Navigation menus in your documentation site
- 🔍 Search functionality
- 📱 Table of contents
- 🗺️ Sitemap generation
- 📊 Documentation analytics

---

## 🚀 Next Steps

Now that you have the basics down, explore more advanced features:

### 1. **Add Rich Metadata**
Learn how to add icons, badges, and custom properties:
```markdown
---
label: Advanced Configuration
description: Deep dive into configuration options
tags: ["advanced", "configuration"]
icon: "settings"
iconType: "material"
badge: "New"
badgeColor: "primary"
---
```

👉 [Read the Frontmatter Guide](../guides/frontmatter.md)

### 2. **Process Multiple Projects**
If you have a monorepo or multiple documentation sets:
```bash
# Process all projects automatically
npx @fsegurai/manifest-generator --all --docs-root ./packages
```

👉 [Learn about Project Structure](../guides/project-structure.md)

### 3. **Integrate with Your Build System**
Automate manifest generation in your build pipeline:
```json
{
  "scripts": {
    "build": "npm run docs:generate && vite build",
    "docs:generate": "manifest-generator --all"
  }
}
```

👉 [See Build System Integration](../integration/build-systems.md)

### 4. **Use the Programmatic API**
Integrate directly into your Node.js application:

```javascript
import {generateManifest} from '@fsegurai/manifest-generator';

const {manifest, searchIndex} = generateManifest('./docs');
console.log('Generated manifest:', manifest);
```

👉 [Explore the API Reference](../api/reference.md)

### 5. **Customize for Your Framework**
See framework-specific examples for React, Vue, Angular, and more:

👉 [Browse Framework Examples](../examples/frameworks.md)

---

## 💡 Quick Tips

### Tip 1: Use Frontmatter for Better Results
Add YAML frontmatter to control how pages appear:

```markdown
---
title: Custom Title
description: A helpful description
tags: ["important", "featured"]
---
```

### Tip 2: Organize with Folders
Create folder hierarchies for nested navigation:

```
docs/
    "label": "README",
    "route": "README",
│   └── installation.md
└── guides/
    ├── README.md
    "label": "Getting Started",
    "route": "getting-started",
```

### Tip 3: Hide Draft Content
    "label": "Reference",
    "route": "api/reference",
```markdown
---
draft: true
---
```

### Tip 4: Watch for Changes
Use a file watcher during development:

```bash
npm install -D chokidar-cli
npx chokidar 'docs/**/*.md' -c 'manifest-generator --route ./docs'
```

---

## ❓ Need Help?

- 📖 [Read the CLI Usage Guide](../guides/cli-usage.md)
- 💡 [See More Examples](../examples/basic-usage.md)
- ❓ [Check the FAQ](../help/faq.md)
- 🔧 [Troubleshooting Guide](../help/troubleshooting.md)
- 🐛 [Report an Issue](https://github.com/fsegurai/manifest-generator/issues)

---

**Ready to dive deeper?** Continue with the [First Steps guide](./first-steps.md) for a hands-on tutorial, or jump to the [CLI Usage guide](../guides/cli-usage.md) to learn all available options

Your content here...
```

### Step 3: Generate Manifests

Run the generator:

```bash
# Process all projects
npx @fsegurai/manifest-generator --all

# Or process specific project
npx @fsegurai/manifest-generator --project my-project
```

## What Gets Generated

The tool creates two files in your documentation directory:

### `manifest.json` - Navigation Structure
```json
[
  {
    "label": "README",
    "route": "README",
    "tags": []
  },
  {
    "label": "Getting Started",
    "route": "getting-started",
    "tags": ["guide", "beginner"]
  },
  {
    "label": "Api",
    "children": [
      {
        "label": "Reference",
        "route": "api/reference",
        "tags": []
      }
    ]
  }
]
```

### `search-index.json` - Search Data
```json
[
  {
    "label": "README",
    "route": "README",
    "tags": []
  },
  {
    "label": "Getting Started",
    "route": "getting-started",
    "tags": ["guide", "beginner"]
  },
  {
    "label": "Reference",
    "route": "api/reference",
    "tags": []
  }
]
```

## Project Structure Detection

The tool automatically detects different documentation structures:

### Docs Subfolder (Default)
```
project/
├── docs/           ← Documentation here
│   ├── README.md
│   └── guide.md
└── package.json
```

### Direct Markdown Files
```
project/
├── README.md       ← Documentation here
├── guide.md
└── package.json
```

### Custom Subfolder
```
project/
├── documentation/  ← Custom docs folder
│   ├── README.md
│   └── guide.md
└── package.json
```

Use `--docs-subfolder documentation` to specify custom folder names.

## Next Steps

- 📖 Read the [CLI Usage Guide](../guides/cli-usage.md) for all command options
- 🔧 Learn about [Configuration](../guides/configuration.md) options
- 📝 Understand [Frontmatter Support](../guides/frontmatter.md)
- 🧪 Check out [Examples](../examples/examples.md) for real-world scenarios
- 🔗 See [Integration](../integration/integration.md) for build system setup

## Common Issues

### No Files Found
- Make sure your Markdown files have `.md` extension
- Check that you're in the right directory
- Verify the folder structure matches expected patterns

### Permission Errors
- Ensure you have write permissions to the output directory
- Try running with appropriate permissions

### Files Not Appearing
- Check if files have `draft: true` or `hidden: true` in frontmatter
- Verify file paths and directory structure
