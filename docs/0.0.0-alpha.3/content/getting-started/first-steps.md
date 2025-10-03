# First Steps

Let's create your first documentation manifest in just a few simple steps!

## Your First Manifest

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

### Step 2: Add Frontmatter (Optional but Recommended)

Add metadata to your Markdown files for better organization:

```markdown
---
label: Getting Started Guide
tags: [guide, beginner]
---

# Getting Started

Your content here...
```

### Step 3: Generate Your First Manifest

Run the generator:

```bash
# Process specific documentation directory
npx @fsegurai/manifest-generator --route ./docs

# Or if you have multiple projects
npx @fsegurai/manifest-generator --all
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
    "title": "Getting Started Guide",
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
    "title": "Getting Started Guide",
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

## Quick Examples

### Single Project
```bash
# Generate for current project's docs
cd my-project
npx @fsegurai/manifest-generator --route ./docs
```

### Multiple Projects (Monorepo)
```bash
# Process all projects in packages directory
npx @fsegurai/manifest-generator --all --docs-root ./packages
```

### Custom Output Location
```bash
# Save manifests to specific location
npx @fsegurai/manifest-generator --route ./docs --output ./public/data
```

### Custom Documentation Folder
```bash
# Use 'documentation' instead of 'docs'
npx @fsegurai/manifest-generator --all --docs-subfolder documentation
```

## Common Project Structures

The tool automatically detects different documentation patterns:

### Pattern 1: Docs Subfolder (Most Common)
```
project/
├── src/
├── docs/           ← Documentation here
│   ├── README.md
│   └── guide.md
└── package.json
```

### Pattern 2: Root Level Documentation
```
project/
├── README.md       ← Documentation at root
├── guide.md
├── src/
└── package.json
```

### Pattern 3: Custom Subfolder
```
project/
├── documentation/  ← Custom folder name
│   ├── README.md
│   └── guide.md
└── package.json
```

## Testing Your Setup

### Verify Files Were Created
```bash
# Check that files exist
ls -la docs/
# Should show: manifest.json and search-index.json
```

### Validate JSON Output
```bash
# Test that JSON is valid
node -e "console.log('Manifest:', JSON.parse(require('fs').readFileSync('./docs/manifest.json', 'utf8')).length, 'items')"
node -e "console.log('Search Index:', JSON.parse(require('fs').readFileSync('./docs/search-index.json', 'utf8')).length, 'items')"
```

### Quick Discovery Test
```bash
# See what projects would be processed
npx @fsegurai/manifest-generator --discover
```

## Common First-Time Issues

### No Files Found
**Problem:** Generator reports no files found.

**Solutions:**
- Ensure files have `.md` extension
- Check the directory exists and has Markdown files
- Verify you're in the correct directory

### Empty Output
**Problem:** Generated files are empty arrays.

**Check for:**
- Files with `draft: true` in frontmatter
- Files with `hidden: true` in frontmatter
- Hidden files (starting with `.`)

### Permission Errors
**Problem:** Cannot write output files.

**Solutions:**
```bash
# Check permissions
ls -la ./docs

# Try different output location
npx @fsegurai/manifest-generator --route ./docs --output ./tmp
```

## Next Steps

Now that you have your first manifest:

1. 📚 Learn about [CLI Usage](../guides/cli-usage.md) for all command options
2. ⚙️ Explore [Configuration](../guides/configuration.md) for customization
3. 🔍 Implement [Search Functionality](../features/search-index.md)
4. 🔗 Set up [Build Integration](../integration/)
5. 💡 Check out [Examples](../examples/) for your framework

## Quick Reference

```bash
# Most common commands
npx @fsegurai/manifest-generator --all              # Process all projects
npx @fsegurai/manifest-generator --route ./docs     # Process specific docs
npx @fsegurai/manifest-generator --discover         # See what would be processed
npx @fsegurai/manifest-generator --help             # Show all options
```

Congratulations! You've successfully generated your first documentation manifest. 🎉
