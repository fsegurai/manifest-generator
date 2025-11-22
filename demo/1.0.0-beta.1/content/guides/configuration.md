# Configuration

The Manifest Generator offers flexible configuration options to customize how your documentation is processed and organized.

## Configuration Methods

### 1. Command Line Options
Configure behavior directly through CLI flags:

```bash
npx @fsegurai/manifest-generator --docs-subfolder documentation --output ./dist
```

### 2. Programmatic Options
Pass options when using the API:

```javascript
import { generateManifestsWithDiscovery } from '@fsegurai/manifest-generator';

generateManifestsWithDiscovery('./projects', {
  docsSubfolder: 'documentation',
  outputDir: './dist'
});
```

### 3. Environment Variables
Set common configurations via environment:

```bash
export MANIFEST_DOCS_SUBFOLDER=documentation
export MANIFEST_OUTPUT_DIR=./dist
npx @fsegurai/manifest-generator --all
```

## Configuration Options

### Directory Configuration

#### `docsSubfolder`
**Default:** `'docs'`  
**Type:** `string`

Specifies the name of the documentation subfolder to look for in each project.

```bash
# CLI
--docs-subfolder documentation

# API
{ docsSubfolder: 'documentation' }
```

**Common Values:**
- `docs` (default)
- `documentation`
- `guides`
- `wiki`
- `help`

#### `outputDir`
**Default:** Same as input directory  
**Type:** `string`

Specifies where to save the generated manifest and search index files.

```bash
# CLI
--output ./dist/manifests

# API
{ outputDir: './dist/manifests' }
```

### Processing Configuration

#### `autoDetect`
**Default:** `true`  
**Type:** `boolean`

Enable or disable automatic project detection.

```javascript
// API only
{ autoDetect: false }
```

#### `project`
**Default:** `null` (process all)  
**Type:** `string`

Process only a specific project by name.

```bash
# CLI
--project my-docs

# API
{ project: 'my-docs' }
```

#### `route`
**Default:** `null`  
**Type:** `string`

Process a specific route/path directly instead of using project discovery.

```bash
# CLI
--route ./specific/docs/path

# API
{ route: './specific/docs/path' }
```

## Frontmatter Configuration

Control how frontmatter is parsed and used in your Markdown files.

### Supported Frontmatter Fields

#### `title`
Override the automatically generated title:

```yaml
---
label: "Custom Page Title"
---
```

#### `tags`
Add tags for categorization and search:

```yaml
---
tags: [guide, beginner, api]
---
```

#### `draft`
Mark content as draft (excluded from output):

```yaml
---
draft: true
---
```

#### `hidden`
Hide content from navigation (excluded from output):

```yaml
---
hidden: true
---
```

### Frontmatter Examples

#### Basic Configuration
```yaml
---
label: API Reference
tags: [api, reference]
---
```

#### Advanced Configuration
```yaml
---
label: Advanced Setup Guide
tags: [guide, advanced, setup]
draft: false
hidden: false
---
```

#### Draft Content
```yaml
---
label: Work in Progress
draft: true
---
```

## Project Structure Patterns

The generator supports multiple documentation organization patterns:

### Pattern 1: Docs Subfolder (Default)
```
project/
├── src/
├── docs/           ← Documentation here
│   ├── README.md
│   ├── guide.md
│   └── api/
│       └── reference.md
└── package.json
```

**Configuration:**
```bash
# Default behavior
npx @fsegurai/manifest-generator --all
```

### Pattern 2: Custom Subfolder
```
project/
├── src/
├── documentation/  ← Custom docs folder
│   ├── README.md
│   └── guide.md
└── package.json
```

**Configuration:**
```bash
npx @fsegurai/manifest-generator --all --docs-subfolder documentation
```

### Pattern 3: Root Level Docs
```
project/
├── README.md       ← Documentation at root
├── guide.md
├── api.md
└── package.json
```

**Configuration:**
```bash
npx @fsegurai/manifest-generator --route ./project
```

### Pattern 4: Multiple Doc Folders
```
project/
├── user-docs/
│   └── guide.md
├── dev-docs/
│   └── api.md
└── package.json
```

**Configuration:**
```bash
# Process each separately
npx @fsegurai/manifest-generator --route ./project/user-docs
npx @fsegurai/manifest-generator --route ./project/dev-docs
```

## Output Customization

### Default Output
By default, files are created in the same directory as the documentation:

```
docs/
├── README.md
├── guide.md
├── manifest.json      ← Generated
└── search-index.json  ← Generated
```

### Custom Output Directory
Specify a different location for generated files:

```bash
npx @fsegurai/manifest-generator --route ./docs --output ./public/data
```

Results in:
```
public/data/
├── manifest.json
└── search-index.json
```

### Multiple Output Locations
Process the same docs to multiple locations:

```bash
# Development build
npx @fsegurai/manifest-generator --route ./docs --output ./src/data

# Production build  
npx @fsegurai/manifest-generator --route ./docs --output ./dist/data
```

## Build Integration

### Package.json Scripts
Add common configurations to your build scripts:

```json
{
  "scripts": {
    "docs:build": "manifest-generator --all",
    "docs:dev": "manifest-generator --route ./docs --output ./src/data",
    "docs:prod": "manifest-generator --all --output ./dist/manifests",
    "docs:custom": "manifest-generator --all --docs-subfolder documentation"
  }
}
```

### Environment-Specific Configs

#### Development
```bash
export NODE_ENV=development
export MANIFEST_OUTPUT_DIR=./src/data
npm run docs:build
```

#### Production
```bash
export NODE_ENV=production
export MANIFEST_OUTPUT_DIR=./dist/manifests
npm run docs:build
```

### CI/CD Configuration

#### GitHub Actions
```yaml
- name: Generate Documentation Manifests
  run: |
    npx @fsegurai/manifest-generator --all \
      --docs-root ./projects \
      --output ./dist/manifests
```

#### GitLab CI
```yaml
generate_docs:
  script:
    - npx @fsegurai/manifest-generator --all --output ./public/manifests
```

## Advanced Configuration

### Custom Title Formatting
The tool automatically formats filenames to titles, but you can override this with frontmatter:

```markdown
<!-- File: advanced-api-guide.md -->
---
label: "Advanced API Integration Guide"
---
```

Without frontmatter: "Advanced Api Guide"  
With frontmatter: "Advanced API Integration Guide"

### Tag-Based Organization
Use tags to create logical groupings:

```yaml
---
tags: [beginner, tutorial]
---
```

```yaml
---
tags: [advanced, api, reference]
---
```

### Conditional Processing
Use draft and hidden flags for conditional content:

```yaml
---
# Show in development, hide in production
draft: false
hidden: ${NODE_ENV === 'production'}
---
```

## Troubleshooting Configuration

### Common Issues

#### Wrong Docs Folder
```bash
# Check what's discovered
npx @fsegurai/manifest-generator --discover

# Adjust subfolder name
npx @fsegurai/manifest-generator --all --docs-subfolder your-folder-name
```

#### Permission Issues
```bash
# Check permissions
ls -la ./output-directory

# Use different output location
npx @fsegurai/manifest-generator --route ./docs --output ./tmp
```

#### No Files Generated
- Verify Markdown files have `.md` extension
- Check frontmatter for `draft: true` or `hidden: true`
- Ensure proper directory structure

### Debug Configuration
```bash
# See what projects are discovered
npx @fsegurai/manifest-generator --discover --docs-root ./your-path

# Test specific configuration
npx @fsegurai/manifest-generator --route ./test-docs --output ./test-output
```

## Best Practices

1. **Consistent Structure**: Use the same documentation structure across projects
2. **Meaningful Tags**: Use descriptive tags for better organization
3. **Clear Titles**: Use frontmatter titles for complex or technical filenames
4. **Environment Configs**: Use different output directories for dev/prod
5. **Version Control**: Don't commit generated files in development
6. **Documentation**: Document your chosen configuration for team members
