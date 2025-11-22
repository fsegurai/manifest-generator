---
title: Features Overview
description: Complete overview of all Manifest Generator features and capabilities
tags: ["features", "capabilities", "overview"]
---

# Features Overview

Discover all the powerful features that make **Manifest Generator** the perfect tool for automatically organizing and indexing your documentation.

---

## 🎯 Core Features

### 📁 Automatic Project Discovery

Intelligently finds documentation projects in various directory structures without manual configuration.

**Supports:**
- Monorepo structures (`packages/*`)
- Versioned documentation (`docs/v1.0.0/`, `docs/v2.0.0/`)
- Multiple project types in one workspace
- Custom subfolder names (`docs`, `documentation`, `guides`)
- Root-level markdown files

**Example:**
```bash
# Discovers all projects automatically
manifest-generator --all --docs-root ./packages
```

👉 [Learn more about Project Structure](../guides/project-structure.md)

---

### 🗂️ Hierarchical Navigation Generation

Automatically builds nested navigation structures from your folder hierarchy.

**Features:**
- Nested folder support (unlimited depth)
- Automatic parent-child relationships
- Folder-level metadata
- Custom ordering via frontmatter
- Smart title formatting

**Input Structure:**
```
docs/
├── getting-started/
│   ├── README.md
│   └── installation.md
└── api/
    ├── README.md
    └── reference.md
```

**Output Manifest:**
```json
[
  {
    "label": "Getting Started",
    "route": "getting-started",
    "isParent": true,
    "children": [...]
  },
  {
    "label": "API",
    "route": "api",
    "isParent": true,
    "children": [...]
  }
]
```

---

### 🔍 Search Index Generation

Creates searchable indexes with full content metadata for implementing search functionality.

**Includes:**
- Page titles and descriptions
- Content routes and paths
- Tags and categories
- Custom metadata from frontmatter
- Hierarchical path information

**Example Output:**
```json
[
  {
    "label": "Getting Started",
    "description": "Quick start guide",
    "route": "getting-started",
    "tags": ["tutorial", "beginner"]
  }
]
```

👉 [Deep dive into Search Index](./search-index.md)

---

### 📝 Frontmatter Parsing

Extracts rich metadata from YAML frontmatter in your Markdown files.

**Supported Properties:**
- `title` / `label` - Custom page title
- `description` - Page description for search
- `tags` - Array of tags/categories
- `draft` - Exclude from production
- `hidden` - Hide from navigation
- `icon` - Icon identifier
- `iconType` - Icon library type
- `badge` - Badge text
- `badgeColor` - Badge color
- `isTitle` - Mark as title-only (no link)
- `isParent` - Mark as parent node

**Example:**
```markdown
---
title: Advanced Configuration
description: Deep dive into configuration options
tags: ["advanced", "config"]
icon: "settings"
iconType: "material"
badge: "New"
badgeColor: "primary"
---

# Content here...
```

👉 [Complete Frontmatter Guide](../guides/frontmatter.md)

---

### 🎨 Rich Metadata Support

Add visual elements and custom properties to enhance your documentation UI.

**Icon Support:**
```markdown
---
icon: "rocket"
iconType: "material"
---
```

**Badge Support:**
```markdown
---
badge: "Beta"
badgeColor: "warning"
---
```

**Custom Properties:**
```markdown
---
customProp: "value"
priority: 10
featured: true
---
```

---

### 🚫 Draft & Hidden Content

Control which content appears in production builds.

**Draft Content:**
```markdown
---
draft: true
---
# This won't appear in manifests
```

**Hidden Content:**
```markdown
---
hidden: true
---
# Hidden from navigation but accessible via direct link
```

---

### ⚡ Zero Dependencies

**Completely self-contained** with no runtime dependencies:
- ✅ Faster installation
- ✅ Smaller package size
- ✅ No dependency conflicts
- ✅ Better security
- ✅ Simpler maintenance

---

### 🔧 Multiple Processing Modes

Flexible processing options for different workflows:

#### 1. **Route Mode** - Process specific path
```bash
manifest-generator --route ./docs
```

#### 2. **Project Mode** - Process named project
```bash
manifest-generator --project my-api-docs
```

#### 3. **All Mode** - Process all discovered projects
```bash
manifest-generator --all
```

#### 4. **Discovery Mode** - List projects without processing
```bash
manifest-generator --discover
```

---

### 🎯 Custom Output Directories

Control where generated files are saved:

```bash
# Save to specific directory
manifest-generator --route ./docs --output ./public/data

# Different output per project
manifest-generator --all --output ./dist/manifests
```

---

### 📦 Multiple Module Systems

Works with all JavaScript module systems:

- ✅ **ES Modules (ESM)** - Modern import/export
- ✅ **CommonJS (CJS)** - Traditional require()
- ✅ **TypeScript** - Full type definitions
- ✅ **UMD** - Universal module definition

**ESM:**
```javascript
import { generateManifest } from '@fsegurai/manifest-generator';
```

**CommonJS:**
```javascript
const { generateManifest } = require('@fsegurai/manifest-generator');
```

**TypeScript:**
```typescript
import { generateManifest, ManifestItem } from '@fsegurai/manifest-generator';
```

---

### 📘 TypeScript Support

Full TypeScript definitions included:

```typescript
interface ManifestItem {
  label: string;
  description?: string;
  route: string;
  tags?: string[];
  isTitle?: boolean;
  isParent?: boolean;
  icon?: string;
  iconType?: string;
  badge?: string;
  badgeColor?: string;
  children?: ManifestItem[];
}
```

👉 [TypeScript Guide](../api/typescript.md)

---

### 🌐 Cross-Platform Compatibility

Works seamlessly across all platforms:

**Operating Systems:**
- ✅ Windows (10, 11, Server)
- ✅ macOS (10.15+)
- ✅ Linux (Ubuntu, Debian, CentOS, Alpine, etc.)

**Node.js Versions:**
- ✅ Node.js 14.x
- ✅ Node.js 16.x (LTS)
- ✅ Node.js 18.x (LTS)
- ✅ Node.js 20.x (LTS)
- ✅ Node.js 21.x+

---

### 🛠️ Build Tool Integration

Integrates with all major build tools:

- ✅ **Webpack** 5+
- ✅ **Vite** 2+
- ✅ **Rollup** 2+
- ✅ **esbuild**
- ✅ **Parcel** 2+
- ✅ **npm/yarn/pnpm/bun scripts**

👉 [Build System Integration](../integration/build-systems.md)

---

### 🎨 Framework Agnostic

Works with any JavaScript framework:

- ✅ React
- ✅ Vue.js
- ✅ Angular
- ✅ Svelte
- ✅ Next.js
- ✅ Nuxt.js
- ✅ Vanilla JavaScript

👉 [Framework Examples](../examples/frameworks.md)

---

### 🔄 CI/CD Ready

Perfect for automation in CI/CD pipelines:

**GitHub Actions:**
```yaml
- name: Generate Manifests
  run: npx @fsegurai/manifest-generator --all
```

**GitLab CI:**
```yaml
generate-docs:
  script:
    - npx @fsegurai/manifest-generator --all
```

**Azure DevOps:**
```yaml
- script: npx @fsegurai/manifest-generator --all
  displayName: 'Generate Documentation Manifests'
```

👉 [CI/CD Integration Guide](../integration/ci-cd.md)

---

### 📊 Smart Title Formatting

Automatically formats filenames into readable titles:

| Filename | Generated Title |
|----------|----------------|
| `getting-started.md` | Getting Started |
| `api-reference.md` | Api Reference |
| `setup-guide.md` | Setup Guide |
| `README.md` | README |

Override with frontmatter:
```markdown
---
title: Custom Title Here
---
```

---

### 🎯 Flexible Project Detection

Detects documentation in multiple structures:

**Pattern 1: Subfolder**
```
project/
└── docs/           ← Detected
    ├── README.md
    └── guide.md
```

**Pattern 2: Root Level**
```
project/
├── README.md       ← Detected
├── GUIDE.md
└── API.md
```

**Pattern 3: Versioned**
```
docs/
├── v1.0.0/         ← Each version detected
└── v2.0.0/
```

**Pattern 4: Monorepo**
```
packages/
├── pkg-a/docs/     ← Detected
└── pkg-b/docs/     ← Detected
```

---

## 🎓 Feature Comparison

| Feature | Description | CLI | API |
|---------|-------------|:---:|:---:|
| Project Discovery | Auto-find projects | ✅ | ✅ |
| Manifest Generation | Build navigation | ✅ | ✅ |
| Search Index | Create search data | ✅ | ✅ |
| Frontmatter Parsing | Extract metadata | ✅ | ✅ |
| Custom Output Dir | Control output location | ✅ | ✅ |
| Draft/Hidden | Filter content | ✅ | ✅ |
| TypeScript | Type definitions | ✅ | ✅ |
| Watch Mode | File watching | 🔧* | 🔧* |

\* Via external file watcher (chokidar, nodemon, etc.)

---

## 📚 Feature Documentation

Explore detailed documentation for each feature:

- 🔍 [**Search Index**](./search-index.md) - How search indexing works
- 📝 [**Frontmatter Support**](../guides/frontmatter.md) - All frontmatter options
- 🏗️ [**Project Structure**](../guides/project-structure.md) - Detection patterns
- ⚙️ [**Configuration**](../guides/configuration.md) - Customization options
- 💻 [**CLI Usage**](../guides/cli-usage.md) - Command-line reference
- 🔧 [**API Reference**](../api/reference.md) - Programmatic usage

---

## 💡 Use Cases

See how these features work together:

- 📚 [**Documentation Sites**](../examples/basic-usage.md) - Build docs sites
- 🎨 [**Component Libraries**](../examples/frameworks.md) - Document components
- 📦 [**Monorepos**](../examples/advanced.md) - Multi-project docs
- 🔗 [**API Documentation**](../examples/advanced.md) - API reference generation

---

## ❓ Questions?

- [**FAQ**](../help/faq.md) - Common questions
- [**Troubleshooting**](../help/troubleshooting.md) - Solve issues
- [**GitHub**](https://github.com/fsegurai/manifest-generator) - Report bugs or request features

