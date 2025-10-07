# Getting Started

Welcome to the Manifest Generator! This guide will help you get up and running quickly.

## What is Manifest Generator?

The Manifest Generator is a powerful tool that automatically creates navigation structures and search indexes from your Markdown documentation. It's designed to help you build better documentation sites by automatically organizing your content.

## Quick Installation

### Using npx (Recommended)

No installation required! Just run:

```bash
npx @fsegurai/manifest-generator --help
```

### Global Installation

Install at once and use anywhere:

```bash
npm install -g @fsegurai/manifest-generator
```

### Project Dependency

Add to your project:

```bash
# As a dev dependency (recommended)
npm install --save-dev @fsegurai/manifest-generator

# As a regular dependency
npm install @fsegurai/manifest-generator
```

## Your First Manifest

Let's create your first documentation manifest in 3 simple steps:

### Step 1: Prepare Your Documentation

Create a simple documentation structure:

```
my-project/
├── docs/
│   ├── README.md
│   ├── getting-started.md
│   └── api/
│       └── reference.md
└── package.json
```

### Step 2: Add Frontmatter (Optional)

Add metadata to your Markdown files:

```markdown
---
label: Getting Started Guide
tags: [guide, beginner]
---

# Getting Started

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
    "title": "README",
    "path": "README",
    "tags": []
  },
  {
    "title": "Getting Started",
    "path": "getting-started",
    "tags": ["guide", "beginner"]
  },
  {
    "title": "Api",
    "children": [
      {
        "title": "Reference",
        "path": "api/reference",
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
    "title": "README",
    "path": "README",
    "tags": []
  },
  {
    "title": "Getting Started",
    "path": "getting-started",
    "tags": ["guide", "beginner"]
  },
  {
    "title": "Reference",
    "path": "api/reference",
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
