# Basic Usage Examples

Simple examples to get you started with the Manifest Generator quickly.

## Single Project Examples

### Basic Documentation Folder

**Project Structure:**
```
my-app/
├── src/
├── package.json
└── docs/
    ├── README.md
    ├── installation.md
    └── api.md
```

**Command:**
```bash
cd my-app
npx @fsegurai/manifest-generator --route ./docs
```

**Generated Output:**
- `docs/manifest.json`
- `docs/search-index.json`

### Custom Documentation Folder

**Project Structure:**
```
my-project/
├── src/
├── package.json
└── documentation/
    ├── README.md
    └── guide.md
```

**Command:**
```bash
npx @fsegurai/manifest-generator --route ./documentation
```

### Root-Level Documentation

**Project Structure:**
```
simple-project/
├── README.md
├── CONTRIBUTING.md
├── API.md
└── package.json
```

**Command:**
```bash
npx @fsegurai/manifest-generator --route ./simple-project
```

## Multiple Projects Examples

### Monorepo with Standard Structure

**Project Structure:**
```
workspace/
├── packages/
│   ├── frontend/
│   │   ├── docs/
│   │   │   ├── README.md
│   │   │   └── components.md
│   │   └── package.json
│   ├── backend/
│   │   ├── docs/
│   │   │   ├── README.md
│   │   │   └── api.md
│   │   └── package.json
│   └── shared/
│       ├── docs/
│       │   └── README.md
│       └── package.json
└── package.json
```

**Command:**
```bash
npx @fsegurai/manifest-generator --all --docs-root ./packages
```

**Result:**
- `packages/frontend/docs/manifest.json`
- `packages/frontend/docs/search-index.json`
- `packages/backend/docs/manifest.json`
- `packages/backend/docs/search-index.json`
- `packages/shared/docs/manifest.json`
- `packages/shared/docs/search-index.json`

### Custom Subfolder Names

**Project Structure:**
```
workspace/
├── project-a/
│   ├── documentation/
│   │   └── README.md
│   └── package.json
└── project-b/
    ├── guides/
    │   └── README.md
    └── package.json
```

**Commands:**
```bash
# For documentation folders
npx @fsegurai/manifest-generator --all --docs-subfolder documentation

# For guides folders
npx @fsegurai/manifest-generator --all --docs-subfolder guides
```

## Output Customization Examples

### Custom Output Directory

```bash
# Save to public directory
npx @fsegurai/manifest-generator --route ./docs --output ./public/data

# Save to build directory
npx @fsegurai/manifest-generator --route ./docs --output ./dist/manifests

# Save to source directory
npx @fsegurai/manifest-generator --route ./docs --output ./src/assets/data
```

### Multiple Output Locations

```bash
# Development build
npx @fsegurai/manifest-generator --route ./docs --output ./src/data

# Production build  
npx @fsegurai/manifest-generator --route ./docs --output ./dist/data

# Both builds in sequence
npx @fsegurai/manifest-generator --route ./docs --output ./src/data && \
npx @fsegurai/manifest-generator --route ./docs --output ./dist/data
```

## Frontmatter Examples

### Basic Frontmatter

```markdown
<!-- docs/getting-started.md -->
---
label: Getting Started Guide
tags: [guide, beginner]
---

# Getting Started

Your content here...
```

**Generated manifest entry:**
```json
{
  "title": "Getting Started Guide",
  "path": "getting-started",
  "tags": ["guide", "beginner"]
}
```

### Content Control

```markdown
<!-- docs/draft-page.md -->
---
label: Work in Progress
draft: true
tags: [internal]
---

# This page won't appear in the manifest
```

```markdown
<!-- docs/hidden-page.md -->
---
label: Internal Notes
hidden: true
---

# This page is also excluded
```

### Advanced Frontmatter

```markdown
<!-- docs/api/authentication.md -->
---
label: User Authentication API
tags: [api, authentication, security, reference]
---

# User Authentication

API reference for user authentication...
```

## Discovery Examples

### See What Would Be Processed

```bash
# Discover projects without processing
npx @fsegurai/manifest-generator --discover

# Discover with custom subfolder
npx @fsegurai/manifest-generator --discover --docs-subfolder documentation

# Discover in specific directory
npx @fsegurai/manifest-generator --discover --docs-root ./my-projects
```

**Sample Output:**
```
Found 3 documentation projects:
- frontend (subfolder) → ./packages/frontend/docs
- backend (subfolder) → ./packages/backend/docs  
- shared (direct) → ./packages/shared
```

## Common Workflow Examples

### Development Workflow

```bash
# Quick check during development
npx @fsegurai/manifest-generator --route ./docs

# Watch for changes (requires chokidar-cli)
npm install -g chokidar-cli
chokidar 'docs/**/*.md' -c 'npx @fsegurai/manifest-generator --route ./docs'
```

### Build Process Integration

```json
{
  "scripts": {
    "docs:build": "manifest-generator --route ./docs",
    "docs:all": "manifest-generator --all",
    "prebuild": "npm run docs:build",
    "build": "your-build-command"
  }
}
```

### Validation Workflow

```bash
# Generate manifests
npx @fsegurai/manifest-generator --route ./docs

# Validate JSON output
node -e "JSON.parse(require('fs').readFileSync('./docs/manifest.json', 'utf8'))"
node -e "JSON.parse(require('fs').readFileSync('./docs/search-index.json', 'utf8'))"

# Check content
node -e "console.log('Items:', JSON.parse(require('fs').readFileSync('./docs/manifest.json', 'utf8')).length)"
```

## Error Recovery Examples

### When No Files Are Found

```bash
# Check what's discovered
npx @fsegurai/manifest-generator --discover

# If nothing found, check file extensions
find . -name "*.md" -type f

# Create test documentation
mkdir docs
echo "# Test" > docs/README.md
npx @fsegurai/manifest-generator --route ./docs
```

### When Output Fails

```bash
# Try different output location
npx @fsegurai/manifest-generator --route ./docs --output ./tmp

# Check permissions
ls -la ./docs

# Use absolute path
npx @fsegurai/manifest-generator --route "$(pwd)/docs"
```

## Testing Examples

### Minimal Test Setup

```bash
# Create minimal test structure
mkdir test-docs
cat > test-docs/README.md << EOF
---
label: Test Documentation
tags: [test]
---

# Test Documentation
This is a test.
EOF

# Generate and verify
npx @fsegurai/manifest-generator --route ./test-docs
cat test-docs/manifest.json
cat test-docs/search-index.json
```

### Complex Test Structure

```bash
# Create nested structure
mkdir -p test-docs/{guides,api}
echo "---\nlabel: Main Page\n---\n# Main" > test-docs/README.md
echo "---\nlabel: Quick Start\ntags: [guide]\n---\n# Quick Start" > test-docs/guides/quickstart.md
echo "---\nlabel: API Reference\ntags: [api, reference]\n---\n# API" > test-docs/api/reference.md

# Generate and check structure
npx @fsegurai/manifest-generator --route ./test-docs
node -e "console.log(JSON.stringify(JSON.parse(require('fs').readFileSync('./test-docs/manifest.json', 'utf8')), null, 2))"
```

## Quick Reference Commands

```bash
# Most common commands
npx @fsegurai/manifest-generator --route ./docs                    # Single project
npx @fsegurai/manifest-generator --all                             # All projects  
npx @fsegurai/manifest-generator --all --docs-root ./packages      # Specific root
npx @fsegurai/manifest-generator --discover                        # See what's found
npx @fsegurai/manifest-generator --help                            # Show all options

# With custom options
npx @fsegurai/manifest-generator --route ./docs --output ./public
npx @fsegurai/manifest-generator --all --docs-subfolder documentation
npx @fsegurai/manifest-generator --project my-app --docs-root ./packages
```

## Next Steps

Once you're comfortable with basic usage:

- 🔧 **Framework Integration**: See [Framework Examples](frameworks.md) for React, Vue, Angular
- ⚡ **Advanced Usage**: Check [Advanced Examples](advanced.md) for complex scenarios
- 📚 **Detailed Guides**: Read the [Guides](../guides/) for comprehensive instructions
- 🔗 **Integration**: Visit [Integration](../integration/) for build system setup
