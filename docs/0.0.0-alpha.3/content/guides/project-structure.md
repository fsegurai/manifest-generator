# Project Structure Detection

The Manifest Generator intelligently detects different documentation structures and adapts its processing accordingly. This guide explains how the detection works and what structures are supported.

## Detection Algorithm

The tool uses a multi-pass detection algorithm:

1. **Subfolder Detection**: Looks for documentation in common subfolder names
2. **Direct Detection**: Checks for Markdown files in the project root
3. **Custom Pattern**: Allows manual specification of documentation paths

## Supported Structures

### 1. Standard Docs Subfolder

The most common pattern with a dedicated `docs` folder:

```
my-project/
├── src/
├── package.json
└── docs/                    ← Detected as 'subfolder' type
    ├── README.md
    ├── getting-started.md
    └── api/
        └── reference.md
```

**Detection Result:**
```javascript
{
  name: "my-project",
  projectPath: "/path/to/my-project",
  docsPath: "/path/to/my-project/docs",
  type: "subfolder"
}
```

### 2. Custom Documentation Folder

Projects using different folder names:

```
my-project/
├── src/
├── package.json
└── documentation/           ← Custom name
    ├── user-guide.md
    └── developer/
        └── api.md
```

**Command:**
```bash
npx @fsegurai/manifest-generator --all --docs-subfolder documentation
```

### 3. Root-Level Documentation

Documentation files directly in the project root:

```
my-project/
├── README.md               ← Detected as 'direct' type
├── CONTRIBUTING.md
├── API.md
├── src/
└── package.json
```

**Detection Result:**
```javascript
{
  name: "my-project",
  projectPath: "/path/to/my-project",
  docsPath: "/path/to/my-project",
  type: "direct"
}
```

### 4. Mixed Structure

Projects with both subfolder docs and root-level documentation:

```
my-project/
├── README.md               ← Root level
├── CHANGELOG.md
├── docs/                   ← Subfolder
│   ├── user-guide.md
│   └── api/
└── package.json
```

**Detection Results:**
- Subfolder type: `/path/to/my-project/docs`
- Direct type: `/path/to/my-project`

### 5. Multiple Documentation Areas

Complex projects with separate documentation sections:

```
enterprise-app/
├── user-docs/
│   ├── getting-started.md
│   └── tutorials/
├── admin-docs/
│   ├── installation.md
│   └── configuration.md
├── developer-docs/
│   ├── api.md
│   └── contributing.md
└── package.json
```

**Processing Approach:**
```bash
# Process each documentation area separately
npx @fsegurai/manifest-generator --route ./enterprise-app/user-docs
npx @fsegurai/manifest-generator --route ./enterprise-app/admin-docs
npx @fsegurai/manifest-generator --route ./enterprise-app/developer-docs
```

## Detection Priority

When multiple structures are detected, the tool follows this priority:

1. **Explicit Route** (`--route` option): Highest priority
2. **Subfolder Detection**: Looks for `docs` or custom subfolder
3. **Direct Detection**: Falls back to root-level Markdown files

## Common Folder Names

The tool recognizes these common documentation folder patterns:

### Standard Names
- `docs` (default)
- `documentation`
- `doc`

### Specialized Names
- `guides`
- `help`
- `wiki`
- `manual`
- `reference`

### Language-Specific
- `docs-en`
- `docs-es` 
- `documentation-fr`

**Usage:**
```bash
npx @fsegurai/manifest-generator --all --docs-subfolder guides
```

## File Detection Rules

### Included Files
- ✅ Files with `.md` extension
- ✅ Files without `draft: true` in frontmatter
- ✅ Files without `hidden: true` in frontmatter
- ✅ Files in subdirectories

### Excluded Files
- ❌ Files starting with `.` (hidden files)
- ❌ Files named `manifest.json` or `search-index.json`
- ❌ Files with `draft: true` frontmatter
- ❌ Files with `hidden: true` frontmatter
- ❌ Non-Markdown files

### Special Cases
```markdown
<!-- Excluded: draft content -->
---
draft: true
title: Work in Progress
---

<!-- Excluded: hidden content -->
---
hidden: true
title: Internal Notes
---

<!-- Included: published content -->
---
title: User Guide
tags: [guide, user]
---
```

## Monorepo Support

### Lerna/Yarn Workspaces Structure
```
monorepo/
├── packages/
│   ├── package-a/
│   │   ├── docs/           ← Detected
│   │   │   └── README.md
│   │   └── package.json
│   ├── package-b/
│   │   ├── documentation/  ← Custom folder
│   │   │   └── guide.md
│   │   └── package.json
│   └── package-c/
│       ├── README.md       ← Root level
│       └── package.json
└── package.json
```

**Processing:**
```bash
# Process all packages
npx @fsegurai/manifest-generator --all --docs-root ./packages

# Process with custom subfolder
npx @fsegurai/manifest-generator --all --docs-root ./packages --docs-subfolder documentation
```

### Nx Workspace Structure
```
nx-workspace/
├── apps/
│   ├── web-app/
│   │   └── docs/
│   └── mobile-app/
│       └── docs/
├── libs/
│   ├── ui-lib/
│   │   └── README.md
│   └── utils-lib/
│       └── docs/
└── workspace.json
```

## Discovery Examples

### Interactive Discovery
See what the tool would detect before processing:

```bash
# Discover in current directory
npx @fsegurai/manifest-generator --discover

# Discover in specific directory
npx @fsegurai/manifest-generator --discover --docs-root ./my-projects

# Discover with custom subfolder
npx @fsegurai/manifest-generator --discover --docs-subfolder documentation
```

**Sample Output:**
```
Found 3 documentation projects:
- project-a (subfolder) → ./project-a/docs
- project-b (direct) → ./project-b
- project-c (subfolder) → ./project-c/documentation
```

### Programmatic Discovery
```javascript
import { discoverProjects } from '@fsegurai/manifest-generator';

const projects = discoverProjects('./workspace', {
  docsSubfolder: 'documentation'
});

projects.forEach(project => {
  console.log(`${project.name}: ${project.type}`);
  console.log(`  Docs: ${project.docsPath}`);
});
```

## Custom Detection Logic

### Excluding Specific Directories
Use `.gitignore`-style patterns or manual filtering:

```javascript
import { discoverProjects } from '@fsegurai/manifest-generator';

const projects = discoverProjects('./workspace')
  .filter(p => !p.name.startsWith('legacy-'))
  .filter(p => p.name !== 'temp-project');
```

### Complex Directory Structures
For non-standard structures, use explicit routes:

```bash
# Process specific paths
npx @fsegurai/manifest-generator --route ./custom/path/to/docs
npx @fsegurai/manifest-generator --route ./another/weird/structure/documentation
```

## Troubleshooting Detection

### No Projects Found

**Check Discovery:**
```bash
npx @fsegurai/manifest-generator --discover
```

**Common Causes:**
- Wrong directory: Use `--docs-root` to specify a correct path
- Custom folder name: Use `--docs-subfolder` for non-standard names
- No Markdown files: Ensure `.md` files exist
- Hidden files: Check for `draft` or `hidden` frontmatter

### Unexpected Results

**Debug Steps:**
1. Run discovery first: `--discover`
2. Check file permissions: `ls -la`
3. Verify Markdown extensions: `.md` required
4. Check frontmatter: Remove `draft: true` if needed

### Multiple Versions Detected

When both subfolder and direct types are found:
```bash
# Choose specific type
npx @fsegurai/manifest-generator --route ./project/docs  # subfolder
npx @fsegurai/manifest-generator --route ./project       # direct
```

## Best Practices

1. **Consistent Naming**: Use the same documentation folder name across projects
2. **Clear Structure**: Organize documentation logically within folders
3. **Proper Extensions**: Always use `.md` for Markdown files
4. **Meaningful Frontmatter**: Use frontmatter to control visibility and metadata
5. **Test Discovery**: Use `--discover` to verify detection before processing
6. **Document Conventions**: Document your team's documentation structure patterns
