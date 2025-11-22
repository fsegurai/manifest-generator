---
label: Get Started with API Reference
tags: ["api", "examples", "advanced", "usage", "batch"]
---

# API Reference

Complete programmatic interface for the Manifest Generator. Use these APIs to integrate manifest generation directly into your Node.js applications.

## 📚 API Documentation

- [📖 Overview—](./README.md)You are here
- [🔧 Reference—](reference.md)Complete API functions and methods
- [📘 TypeScript—](typescript.md)Type definitions and interfaces
- [💡 Examples](examples.md) - Practical API usage examples

## Quick Start

### ES Modules
```javascript
import { 
  generateManifest, 
  generateManifestsWithDiscovery, 
  discoverProjects 
} from '@fsegurai/manifest-generator';
```

### CommonJS
```javascript
const { 
  generateManifest, 
  generateManifestsWithDiscovery, 
  discoverProjects 
} = require('@fsegurai/manifest-generator');
```

## Core Functions

### `generateManifest(projectPath)`
Generate a manifest and search index for a single project.

```javascript
const result = generateManifest('./docs');
// Returns: { manifest: [...], searchIndex: [...] }
```

### `generateManifestsWithDiscovery(rootDir, options)`
Generate manifests with automatic project discovery.

```javascript
const results = generateManifestsWithDiscovery('./projects', {
  docsSubfolder: 'documentation',
  outputDir: './dist'
});
```

### `discoverProjects(rootDir, options)`
Discover documentation projects without processing them.

```javascript
const projects = discoverProjects('./workspace');
// Returns array of discovered project information
```

## Use Cases

- **Build System Integration**: Automate manifest generation in webpack, Vite, etc.
- **Custom Processing**: Add custom logic before/after manifest generation
- **Dynamic Generation**: Generate manifests on-demand in web applications
- **Batch Processing**: Process multiple documentation sources programmatically

## Next Steps

- 🔧 **Detailed API**: See [Reference](reference.md) for complete function signatures
- 📘 **TypeScript**: Check [TypeScript](typescript.md) for type definitions
- 💡 **Examples**: Browse [Examples](examples.md) for implementation patterns
- 🔗 **Integration**: Visit [Integration](../integration/) for build system setup
