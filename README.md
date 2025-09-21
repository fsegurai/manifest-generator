<p align="center" class="intro">
  <img alt="Manifest Generator Logo" src="https://raw.githubusercontent.com/fsegurai/manifest-generator/main/public/manifest-generator.svg">
</p>

<p align="center" class="intro">
  <a href="https://github.com/fsegurai/manifest-generator">
      <img src="https://img.shields.io/azure-devops/build/fsegurai/06cb8729-d71a-43f5-a4b8-f387da813f19/27/main?label=Build%20Status&"
          alt="Build Main Status">
  </a>
  <a href="https://github.com/fsegurai/manifest-generator/releases/latest">
      <img src="https://img.shields.io/github/v/release/fsegurai/manifest-generator"
          alt="Latest Release">
  </a>
  <br>
  <img alt="GitHub contributors" src="https://img.shields.io/github/contributors/fsegurai/manifest-generator">
  <img alt="Dependency status for repo" src="https://img.shields.io/librariesio/github/fsegurai/manifest-generator">
  <a href="https://opensource.org/licenses/MIT">
    <img alt="GitHub License" src="https://img.shields.io/github/license/fsegurai/manifest-generator">
  </a>
  <br>
  <img alt="Stars" src="https://img.shields.io/github/stars/fsegurai/manifest-generator?style=square&labelColor=343b41"/> 
  <img alt="Forks" src="https://img.shields.io/github/forks/fsegurai/manifest-generator?style=square&labelColor=343b41"/>
</p>

# @fsegurai/manifest-generator

**A library and CLI tool for generating documentation manifests and search indexes from Markdown files.**

A powerful and flexible documentation manifest generator that automatically creates
navigation structures and search indexes for your Markdown documentation.

### 📋 Table of Contents

- [🚀 Features](#-features)
- [📦 Installation](#-installation)
- [🖥️ CLI Usage](#️-cli-usage)
    - [Global Installation](#global-installation)
    - [Using npx (Recommended)](#using-npx-recommended)
    - [CLI Commands](#cli-commands)
    - [Production Examples](#production-examples)
- [📚 API Usage](#-api-usage)
    - [ES Modules](#es-modules)
    - [CommonJS](#commonjs)
    - [API Reference](#api-reference)
- [📁 Project Structure Detection](#-project-structure-detection)
- [📄 Output Files](#-output-files)
- [⚙️ Configuration](#️-configuration)
- [🔧 Integration Examples](#-integration-examples)
- [📝 Frontmatter Support](#-frontmatter-support)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## 🚀 Features

- **Automatic Discovery**: Intelligently finds documentation projects in various folder structures
- **Flexible Input**: Supports both direct markdown files and docs subfolders
- **CLI & API**: Use via command line or programmatically in your code
- **Frontmatter Parsing**: Extracts metadata from YAML frontmatter
- **Search Index Generation**: Creates searchable indexes for your documentation
- **TypeScript Support**: Full TypeScript definitions included
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Multiple Output Formats**: Generates both navigation manifests and search indexes

## 📦 Installation

### Global Installation

```bash
npm install -g @fsegurai/manifest-generator
```

### Project Dependency

```bash
# As a dev dependency
npm install --save-dev @fsegurai/manifest-generator

# As a regular dependency
npm install @fsegurai/manifest-generator
```

## 🖥️ CLI Usage

### Using npx (Recommended)

No installation required—run directly:

```bash
# Process all projects in current directory
npx @fsegurai/manifest-generator --all

# Process specific project
npx @fsegurai/manifest-generator --project my-docs

# Get help
npx @fsegurai/manifest-generator --help
```

### Global Installation

If installed globally, use the `manifest-generator` command:

```bash
manifest-generator --all
manifest-generator --project my-docs
```

### CLI Commands

#### Basic Usage

```bash
# Process all projects automatically
npx @fsegurai/manifest-generator --all

# Process a specific project by name
npx @fsegurai/manifest-generator --project sample-project

# Process a specific documentation path
npx @fsegurai/manifest-generator --route ./docs

# Discover projects without processing
npx @fsegurai/manifest-generator --discover
```

#### Advanced Options

```bash
# Specify custom docs root directory
npx @fsegurai/manifest-generator --all --docs-root ./my-projects

# Custom output directory
npx @fsegurai/manifest-generator --route ./docs --output ./dist

# Custom docs subfolder name (default: 'docs')
npx @fsegurai/manifest-generator --all --docs-subfolder documentation

# Process positional path argument
npx @fsegurai/manifest-generator ./path/to/documentation
```

#### Help and Information

```bash
# Show help
npx @fsegurai/manifest-generator --help

# Show version
npx @fsegurai/manifest-generator --version
```

### Production Examples

#### CI/CD Pipeline (GitHub Actions)

```yaml
-   name: Generate Documentation Manifests
    run: npx @fsegurai/manifest-generator --all --docs-root ./projects
```

#### Monorepo Processing

```bash
# Process all packages in a monorepo
npx @fsegurai/manifest-generator --all --docs-root ./packages

# Process specific package
npx @fsegurai/manifest-generator --project my-package --docs-root ./packages
```

#### Build Pipeline Integration

```bash
# Generate manifests for built documentation
npx @fsegurai/manifest-generator --route ./dist/docs --output ./public
```

#### Package.json Scripts

```json
{
    "scripts": {
        "build:docs": "manifest-generator --all",
        "docs:manifest": "manifest-generator --route ./documentation",
        "docs:discover": "manifest-generator --discover"
    }
}
```

## 📚 API Usage

### ES Modules

```javascript
import {
    generateManifest,
    generateDocsManifests,
    generateManifestsWithDiscovery,
    discoverProjects
} from '@fsegurai/manifest-generator';

// Generate manifest for a single project
const result = generateManifest('./docs');
console.log('Generated:', result.manifest);
console.log('Search Index:', result.searchIndex);

// Process all projects with auto-discovery
const results = generateManifestsWithDiscovery('./projects', {
    autoDetect: true,
    docsSubfolder: 'docs'
});

// Discover projects without processing
const projects = discoverProjects('./projects');
console.log('Found projects:', projects);
```

### CommonJS

```javascript
const {
    generateManifest,
    generateManifestsWithDiscovery
} = require('@fsegurai/manifest-generator');

// Process specific project
generateManifestsWithDiscovery('./projects', {
    project: 'my-app',
    outputDir: './dist'
});
```

### API Reference

#### Core Functions

##### `generateManifest(projectPath: string): ManifestResult`

Generates a manifest for a single documentation project.

```javascript
const result = generateManifest('./my-docs');
// Returns: { manifest: NavigationItem[], searchIndex: SearchEntry[] }
```

##### `generateDocsManifests(docsRoot: string): void`

Processes all subdirectories as separate projects.

```javascript
generateDocsManifests('./projects');
// Generates manifest.json and search-index.json in each subdirectory
```

##### `generateManifestsWithDiscovery(rootDir: string, options?: GenerationOptions): ProcessingResult[]`

Advanced function with flexible options and auto-discovery.

```javascript
const results = generateManifestsWithDiscovery('./projects', {
    project: 'specific-project',     // Process specific project
    route: './custom/path',          // Process specific path
    outputDir: './output',           // Custom output directory
    docsSubfolder: 'documentation',  // Custom docs folder name
    autoDetect: true                 // Auto-discover projects
});
```

##### `discoverProjects(rootDir: string, options?: DiscoveryOptions): DiscoveredProject[]`

Discovers documentation projects without processing them.

```javascript
const projects = discoverProjects('./projects', {
    docsSubfolder: 'docs',  // Folder name to look for
    pattern: null           // Future: regex pattern support
});
```

#### Utility Functions

##### `formatTitle(name: string): string`

Converts filenames to readable titles.

```javascript
formatTitle('getting-started-guide.md'); // "Getting Started Guide"
```

##### `parseFrontmatter(content: string): Record<string, any>`

Extracts YAML frontmatter from Markdown content.

```javascript
const frontmatter = parseFrontmatter(`---
title: My Document
tags: ["guide", "tutorial"]
---
# Content here`);
// Returns: { title: "My Document", tags: ["guide", "tutorial"] }
```

#### TypeScript Interfaces

```typescript
interface NavigationItem {
    title: string;
    path?: string;
    tags?: string[];
    children?: NavigationItem[];
}

interface SearchEntry {
    title: string;
    path: string;
    tags?: string[];
}

interface ManifestResult {
    manifest: NavigationItem[];
    searchIndex: SearchEntry[];
}

interface DiscoveredProject {
    name: string;
    projectPath: string;
    docsPath: string;
    type: 'subfolder' | 'direct';
}

interface GenerationOptions {
    project?: string | null;
    route?: string | null;
    outputDir?: string | null;
    docsSubfolder?: string;
    autoDetect?: boolean;
}
```

## 📁 Project Structure Detection

The generator automatically detects different documentation structures:

### Structure 1: Docs Subfolders

```
projects/
├── project-a/
│   ├── docs/           ← Documentation here
│   │   ├── README.md
│   │   ├── guide.md
│   │   └── api/
│   ├── manifest.json   ← Generated here
│   └── search-index.json
└── project-b/
    └── docs/
        └── *.md files
```

### Structure 2: Direct Markdown Files

```
projects/
├── project-a/
│   ├── README.md       ← Documentation here
│   ├── guide.md
│   ├── manifest.json   ← Generated here
│   └── search-index.json
└── project-b/
    └── *.md files
```

### Structure 3: Custom Documentation Folders

```
projects/
├── project-a/
│   ├── documentation/  ← Custom folder name
│   │   └── *.md files
│   ├── manifest.json
│   └── search-index.json
```

## 📄 Output Files

### manifest.json

Contains the hierarchical navigation structure:

```json
[
    {
        "title": "Getting Started",
        "path": "getting-started",
        "tags": [
            "tutorial",
            "beginner"
        ]
    },
    {
        "title": "API Reference",
        "children": [
            {
                "title": "Authentication",
                "path": "api/auth",
                "tags": [
                    "api",
                    "security"
                ]
            }
        ]
    }
]
```

### search-index.json

Contains flattened search data:

```json
[
    {
        "title": "Getting Started",
        "path": "getting-started",
        "tags": [
            "tutorial",
            "beginner"
        ]
    },
    {
        "title": "Authentication",
        "path": "api/auth",
        "tags": [
            "api",
            "security"
        ]
    }
]
```

## ⚙️ Configuration

### Frontmatter Options

Control document processing with frontmatter:

```markdown
---
title: "Custom Title"           # Override generated title
tags: ["api", "reference"]     # Add searchable tags
draft: true                    # Exclude from manifest
hidden: true                   # Hide from navigation
---

# Your content here
```

### CLI Options Reference

| Option                    | Short | Description                      | Default           |
|---------------------------|-------|----------------------------------|-------------------|
| `--all`                   | `-a`  | Process all projects             | `false`           |
| `--project <name>`        | `-p`  | Process specific project         | `null`            |
| `--route <path>`          | `-r`  | Process specific path            | `null`            |
| `--docs-root <path>`      | `-d`  | Root directory for docs          | Current directory |
| `--output <path>`         | `-o`  | Output directory                 | Project directory |
| `--docs-subfolder <name>` | `-s`  | Docs folder name                 | `'docs'`          |
| `--discover`              |       | List projects without processing | `false`           |
| `--help`                  | `-h`  | Show help                        |                   |
| `--version`               | `-v`  | Show version                     |                   |

## 🔧 Integration Examples

### Webpack Integration

```javascript
// webpack.config.js
const {generateManifest} = require('@fsegurai/manifest-generator');

module.exports = {
    // ...existing config
    plugins: [
        {
            apply: (compiler) => {
                compiler.hooks.afterEmit.tap('ManifestGenerator', () => {
                    generateManifest('./src/docs');
                });
            }
        }
    ]
};
```

### Gulp Integration

```javascript
// gulpfile.js
const {generateManifestsWithDiscovery} = require('@fsegurai/manifest-generator');

gulp.task('docs:manifest', () => {
    return generateManifestsWithDiscovery('./src/projects', {
        autoDetect: true,
        outputDir: './dist'
    });
});
```

### Node.js Script

```javascript
#!/usr/bin/env node
import {generateManifestsWithDiscovery} from '@fsegurai/manifest-generator';

async function buildDocs() {
    try {
        const results = generateManifestsWithDiscovery(process.cwd(), {
            autoDetect: true
        });

        console.log(`✅ Processed ${results.length} projects`);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

buildDocs();
```

## 📝 Frontmatter Support

Supported frontmatter fields:

```yaml
---
title: "Document Title"        # Custom title (overrides filename)
tags: [ "api", "guide" ]        # Searchable tags
draft: true                   # Exclude from processing
hidden: true                  # Hide from navigation
weight: 10                    # Future: custom ordering
description: "Brief summary"   # Future: meta description
---
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to
discuss what you would like to change.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/fsegurai/manifest-generator.git
cd manifest-generator

# Install dependencies
npm install

# Run tests
npm test:packages

# Build the package
npm run build:packages
```

## 🧼 License

Licensed under [MIT](https://opensource.org/licenses/MIT).