# CLI Usage Guide

The Manifest Generator provides a comprehensive command-line interface for processing your documentation. This guide covers all available commands and options.

## Basic Syntax

```bash
npx @fsegurai/manifest-generator [options] [path]
manifest-generator [options] [path]
```

## Command Options

### Processing Options

#### `--all` / `-a`
Process all projects in the docs root directory.

```bash
# Process all projects in current directory
npx @fsegurai/manifest-generator --all

# Process all projects in specific directory
npx @fsegurai/manifest-generator --all --docs-root /path/to/projects
```

#### `--project <name>` / `-p <name>`
Process a specific project by name.

```bash
# Process specific project
npx @fsegurai/manifest-generator --project my-docs

# Process project in different root directory
npx @fsegurai/manifest-generator --project my-docs --docs-root /path/to/projects
```

#### `--route <path>` / `-r <path>`
Process a specific route/path directly.

```bash
# Process specific documentation path
npx @fsegurai/manifest-generator --route ./my-project/documentation

# Process with custom output location
npx @fsegurai/manifest-generator --route ./docs --output ./dist
```

### Directory Options

#### `--docs-root <path>` / `-d <path>`
Specify the root directory for documentation projects (default: current directory).

```bash
# Set custom docs root
npx @fsegurai/manifest-generator --all --docs-root /workspace/projects

# Use relative path
npx @fsegurai/manifest-generator --all --docs-root ./packages
```

#### `--output <path>` / `-o <path>`
Specify the output directory for generated files.

```bash
# Custom output directory
npx @fsegurai/manifest-generator --route ./docs --output ./public

# Output to specific location
npx @fsegurai/manifest-generator --project my-docs --output ./build/manifests
```

#### `--docs-subfolder <name>` / `-s <name>`
Name of docs subfolder (default: 'docs').

```bash
# Use 'documentation' instead of 'docs'
npx @fsegurai/manifest-generator --all --docs-subfolder documentation

# Use 'guides' subfolder
npx @fsegurai/manifest-generator --all --docs-subfolder guides
```

### Utility Options

#### `--discover`
Discover and list projects without processing them.

```bash
# See what projects would be processed
npx @fsegurai/manifest-generator --discover

# Discover in specific directory
npx @fsegurai/manifest-generator --discover --docs-root /path/to/projects
```

#### `--help` / `-h`
Show a help message with all available options.

```bash
npx @fsegurai/manifest-generator --help
```

#### `--version` / `-v`
Show version number.

```bash
npx @fsegurai/manifest-generator --version
```

## Usage Examples

### Development Scenarios

#### Single Project Development
```bash
# Quick generation for current project
npx @fsegurai/manifest-generator --route ./docs

# Generate with custom output
npx @fsegurai/manifest-generator --route ./docs --output ./src/assets
```

#### Monorepo Development
```bash
# Process all packages
npx @fsegurai/manifest-generator --all --docs-root ./packages

# Process specific package
npx @fsegurai/manifest-generator --project my-package --docs-root ./packages
```

#### Custom Documentation Structure
```bash
# Custom docs folder name
npx @fsegurai/manifest-generator --all --docs-subfolder documentation

# Multiple custom folders
npx @fsegurai/manifest-generator --route ./guides
npx @fsegurai/manifest-generator --route ./api-docs
```

### Production Scenarios

#### CI/CD Pipeline
```bash
# In GitHub Actions or similar
npx @fsegurai/manifest-generator --all --docs-root ./projects --output ./dist

# For static site generation
npx @fsegurai/manifest-generator --route ./content --output ./public/data
```

#### Build Scripts
Add to your `package.json`:

```json
{
  "scripts": {
    "docs:build": "manifest-generator --all",
    "docs:watch": "manifest-generator --route ./docs && echo 'Manifests updated'",
    "docs:production": "manifest-generator --all --output ./dist/manifests"
  }
}
```

#### Docker Integration
```dockerfile
# In Dockerfile
RUN npx @fsegurai/manifest-generator --all --docs-root /app/docs --output /app/public
```

### Advanced Workflows

#### Multi-Environment Setup
```bash
# Development
npx @fsegurai/manifest-generator --route ./docs --output ./src/data

# Staging
npx @fsegurai/manifest-generator --all --docs-root ./staging-docs --output ./staging/data

# Production
npx @fsegurai/manifest-generator --all --docs-root ./production-docs --output ./dist/data
```

#### Selective Processing
```bash
# Process only specific projects
npx @fsegurai/manifest-generator --project project-a
npx @fsegurai/manifest-generator --project project-b

# Discover first, then process
npx @fsegurai/manifest-generator --discover
npx @fsegurai/manifest-generator --project selected-project
```

## Output Files

Each processed documentation directory will contain:

- **`manifest.json`** - Hierarchical navigation structure
- **`search-index.json`** - Flat search index with all documents

## Exit Codes

- `0` - Success
- `1` - Error (file not found, permission issues, etc.)

## Common Command Patterns

### Quick Start
```bash
# Most common: process everything
npx @fsegurai/manifest-generator --all
```

### Development
```bash
# Watch specific docs folder
npx @fsegurai/manifest-generator --route ./docs
```

### Production Build
```bash
# Build for deployment
npx @fsegurai/manifest-generator --all --output ./dist/manifests
```

### Debugging
```bash
# See what would be processed
npx @fsegurai/manifest-generator --discover

# Process specific item for testing
npx @fsegurai/manifest-generator --route ./problematic-docs
```

## Troubleshooting

### Command Not Found
If you get "command not found":
```bash
# Install globally first
npm install -g @fsegurai/manifest-generator

# Or always use npx
npx @fsegurai/manifest-generator --help
```

### Permission Denied
```bash
# Check output directory permissions
ls -la ./output-directory

# Try different output location
npx @fsegurai/manifest-generator --route ./docs --output ./tmp
```

### No Projects Found
```bash
# Check what's discovered
npx @fsegurai/manifest-generator --discover

# Verify directory structure
ls -la ./docs

# Try different docs subfolder name
npx @fsegurai/manifest-generator --all --docs-subfolder documentation
```
