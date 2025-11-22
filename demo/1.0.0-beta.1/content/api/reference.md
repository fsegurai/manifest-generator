# API Reference

Use the Manifest Generator programmatically in your Node.js applications. This guide covers all available functions, types, and usage patterns.

## Installation

```bash
npm install @fsegurai/manifest-generator
```

## Import Methods

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

## TypeScript Definitions

The package includes full TypeScript definitions for a better development experience.

### Core Interfaces

#### `NavigationItem`
Represents a single navigation item in the manifest.

```typescript
interface NavigationItem {
  label: string;           // Display title
  path?: string;          // Optional path for navigation
  tags?: string[];        // Optional tags from frontmatter
  children?: NavigationItem[]; // Optional nested items
}
```

#### `SearchEntry`
Represents an entry in the search index.

```typescript
interface SearchEntry {
  label: string;    // Document title
  path: string;     // Document path
  tags?: string[];  // Document tags
}
```

#### `ManifestResult`
Result object from manifest generation.

```typescript
interface ManifestResult {
  manifest: NavigationItem[];  // Hierarchical navigation
  searchIndex: SearchEntry[];  // Flat search index
}
```

#### `DiscoveredProject`
Information about discovered documentation projects.

```typescript
interface DiscoveredProject {
  name: string;        // Project name
  projectPath: string; // Full path to project
  docsPath: string;    // Full path to docs directory
  type: 'subfolder' | 'direct'; // Structure type
}
```

#### `ProcessingResult`
Result from processing operations.

```typescript
interface ProcessingResult {
  name: string;      // Project name
  processed: boolean; // Whether processing succeeded
  error?: string;    // Error message if failed
}
```

#### `DiscoveryOptions`
Options for project discovery.

```typescript
interface DiscoveryOptions {
  docsSubfolder?: string; // Name of docs subfolder (default: 'docs')
}
```

#### `GenerationOptions`
Options for manifest generation with discovery.

```typescript
interface GenerationOptions {
  project?: string;        // Specific project name
  route?: string;         // Specific route path
  outputDir?: string;     // Custom output directory
  docsSubfolder?: string; // Custom docs subfolder name
  autoDetect?: boolean;   // Enable auto-detection (default: true)
}
```

## Core Functions

### `generateManifest(projectPath)`

Generate a manifest and search index for a single project.

```javascript
import { generateManifest } from '@fsegurai/manifest-generator';

const result = generateManifest('./my-project/docs');

console.log('Navigation:', result.manifest);
console.log('Search Index:', result.searchIndex);
```

**Parameters:**
- `projectPath` (string): Path to the documentation directory

**Returns:** `ManifestResult`

**Example:**
```javascript
const result = generateManifest('./docs');

// result.manifest contains hierarchical navigation
// result.searchIndex contains flat search data
```

### `generateManifestsWithDiscovery(rootDir, options)`

Generate manifests with automatic project discovery and flexible processing options.

```javascript
import { generateManifestsWithDiscovery } from '@fsegurai/manifest-generator';

// Process all projects
const results = generateManifestsWithDiscovery('./projects', {
  docsSubfolder: 'documentation'
});

// Process specific project
const results = generateManifestsWithDiscovery('./projects', {
  project: 'my-app',
  outputDir: './dist'
});

// Process specific route
const results = generateManifestsWithDiscovery('./projects', {
  route: './specific/docs/path',
  outputDir: './public'
});
```

**Parameters:**
- `rootDir` (string): Root directory to process
- `options` (GenerationOptions): Processing options

**Returns:** `ProcessingResult[]`

**Options:**
- `project`: Process only this specific project
- `route`: Process this specific path directly
- `outputDir`: Custom output directory for generated files
- `docsSubfolder`: Name of docs subfolder (default: 'docs')
- `autoDetect`: Enable automatic project detection (default: true)

### `discoverProjects(rootDir, options)`

Discover documentation projects without processing them.

```javascript
import { discoverProjects } from '@fsegurai/manifest-generator';

const projects = discoverProjects('./workspace', {
  docsSubfolder: 'documentation'
});

projects.forEach(project => {
  console.log(`Found: ${project.name} (${project.type})`);
  console.log(`  Project: ${project.projectPath}`);
  console.log(`  Docs: ${project.docsPath}`);
});
```

**Parameters:**
- `rootDir` (string): Directory to scan
- `options` (DiscoveryOptions): Discovery options

**Returns:** `DiscoveredProject[]`

## Usage Examples

### Basic Usage

#### Generate Single Project
```javascript
import { generateManifest } from '@fsegurai/manifest-generator';
import fs from 'fs';

// Generate manifest
const result = generateManifest('./docs');

// Save to files
fs.writeFileSync('manifest.json', JSON.stringify(result.manifest, null, 2));
fs.writeFileSync('search-index.json', JSON.stringify(result.searchIndex, null, 2));
```

#### Discover Projects
```javascript
import { discoverProjects } from '@fsegurai/manifest-generator';

const projects = discoverProjects('./workspace');

console.log(`Found ${projects.length} documentation projects:`);
projects.forEach(p => console.log(`- ${p.name} (${p.type})`));
```

### Advanced Usage

#### Custom Processing Pipeline
```javascript
import { discoverProjects, generateManifest } from '@fsegurai/manifest-generator';
import fs from 'fs';
import path from 'path';

async function processAllProjects(rootDir) {
  // Discover all projects
  const projects = discoverProjects(rootDir);
  
  // Process each project
  for (const project of projects) {
    try {
      console.log(`Processing ${project.name}...`);
      
      // Generate manifest
      const result = generateManifest(project.docsPath);
      
      // Custom output location
      const outputDir = path.join(project.projectPath, 'generated');
      
      // Ensure directory exists
      fs.mkdirSync(outputDir, { recursive: true });
      
      // Save files
      fs.writeFileSync(
        path.join(outputDir, 'manifest.json'),
        JSON.stringify(result.manifest, null, 2)
      );
      
      fs.writeFileSync(
        path.join(outputDir, 'search-index.json'),
        JSON.stringify(result.searchIndex, null, 2)
      );
      
      console.log(`✅ Processed ${project.name}`);
    } catch (error) {
      console.error(`❌ Error processing ${project.name}:`, error.message);
    }
  }
}

processAllProjects('./my-workspace');
```

#### Integration with Build Tools
```javascript
// webpack.config.js or similar
import { generateManifestsWithDiscovery } from '@fsegurai/manifest-generator';

class ManifestGeneratorPlugin {
  apply(compiler) {
    compiler.hooks.beforeCompile.tapAsync('ManifestGenerator', (params, callback) => {
      generateManifestsWithDiscovery('./src/docs', {
        outputDir: './dist/manifests'
      });
      callback();
    });
  }
}

export default {
  // ... webpack config
  plugins: [
    new ManifestGeneratorPlugin()
  ]
};
```

#### Express.js Integration
```javascript
import express from 'express';
import { generateManifest } from '@fsegurai/manifest-generator';

const app = express();

// Dynamic manifest generation
app.get('/api/manifest', (req, res) => {
  try {
    const result = generateManifest('./docs');
    res.json(result.manifest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dynamic search index
app.get('/api/search-index', (req, res) => {
  try {
    const result = generateManifest('./docs');
    res.json(result.searchIndex);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Error Handling

```javascript
import { generateManifest } from '@fsegurai/manifest-generator';

try {
  const result = generateManifest('./docs');
  console.log('Success:', result);
} catch (error) {
  if (error.code === 'ENOENT') {
    console.error('Documentation directory not found');
  } else if (error.code === 'EACCES') {
    console.error('Permission denied');
  } else {
    console.error('Generation failed:', error.message);
  }
}
```

### Async/Await Patterns

```javascript
import { generateManifest } from '@fsegurai/manifest-generator';
import { promisify } from 'util';
import fs from 'fs';

const writeFile = promisify(fs.writeFile);

async function generateAndSave(docsPath, outputPath) {
  try {
    // Generate manifest
    const result = generateManifest(docsPath);
    
    // Save files concurrently
    await Promise.all([
      writeFile(
        `${outputPath}/manifest.json`,
        JSON.stringify(result.manifest, null, 2)
      ),
      writeFile(
        `${outputPath}/search-index.json`,
        JSON.stringify(result.searchIndex, null, 2)
      )
    ]);
    
    console.log('Files saved successfully');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

generateAndSave('./docs', './output');
```

## Return Value Structures

### Manifest Structure
The generated manifest is an array of navigation items:

```json
[
  {
    "title": "Getting Started",
    "path": "getting-started",
    "tags": ["guide", "beginner"]
  },
  {
    "title": "API",
    "children": [
      {
        "title": "Reference",
        "path": "api/reference",
        "tags": ["api", "reference"]
      }
    ]
  }
]
```

### Search Index Structure
The search index is a flat array of all documents:

```json
[
  {
    "title": "Getting Started",
    "path": "getting-started",
    "tags": ["guide", "beginner"]
  },
  {
    "title": "Reference",
    "path": "api/reference",
    "tags": ["api", "reference"]
  }
]
```

## Best Practices

1. **Error Handling**: Always wrap API calls in try-catch blocks
2. **Path Validation**: Verify paths exist before processing
3. **Output Directory**: Ensure output directories exist or create them
4. **Async Operations**: Use async/await for file operations in production
5. **Caching**: Consider caching results for frequently accessed manifests
6. **Validation**: Validate frontmatter data before processing
