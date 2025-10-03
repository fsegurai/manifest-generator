# TypeScript Definitions

The Manifest Generator includes comprehensive TypeScript definitions for enhanced development experience and type safety.

## Core Interfaces

### `NavigationItem`
Represents a single navigation item in the manifest structure.

```typescript
interface NavigationItem {
  label: string;                    // Display title for the navigation item
  path?: string;                   // Optional path for navigation (undefined for folders)
  tags?: string[];                 // Optional tags from frontmatter
  children?: NavigationItem[];     // Optional nested navigation items
}
```

**Usage Example:**
```typescript
const navItem: NavigationItem = {
  label: "Getting Started",
  path: "getting-started",
  tags: ["guide", "beginner"]
};

const folderItem: NavigationItem = {
  label: "API",
  children: [
    {
      label: "Reference",
      path: "api/reference",
      tags: ["api", "reference"]
    }
  ]
};
```

### `SearchEntry`
Represents an entry in the flat search index.

```typescript
interface SearchEntry {
  label: string;        // Document title
  path: string;         // Document path (required for search)
  tags?: string[];      // Optional document tags
}
```

**Usage Example:**
```typescript
const searchEntry: SearchEntry = {
  label: "User Authentication API",
  path: "api/authentication",
  tags: ["api", "authentication", "security"]
};
```

### `ManifestResult`
Result object returned from manifest generation functions.

```typescript
interface ManifestResult {
  manifest: NavigationItem[];     // Hierarchical navigation structure
  searchIndex: SearchEntry[];     // Flat search index
}
```

**Usage Example:**
```typescript
import { generateManifest } from '@fsegurai/manifest-generator';

const result: ManifestResult = generateManifest('./docs');
console.log(`Generated ${result.manifest.length} navigation items`);
console.log(`Generated ${result.searchIndex.length} search entries`);
```

### `DiscoveredProject`
Information about discovered documentation projects.

```typescript
interface DiscoveredProject {
  name: string;                     // Project name (directory name)
  projectPath: string;              // Full path to project directory
  docsPath: string;                 // Full path to documentation directory
  type: 'subfolder' | 'direct';     // Documentation structure type
}
```

**Usage Example:**
```typescript
import { discoverProjects } from '@fsegurai/manifest-generator';

const projects: DiscoveredProject[] = discoverProjects('./workspace');
projects.forEach(project => {
  console.log(`${project.name}: ${project.type} at ${project.docsPath}`);
});
```

### `ProcessingResult`
Result from processing operations, indicating success or failure.

```typescript
interface ProcessingResult {
  name: string;           // Project name that was processed
  processed: boolean;     // Whether processing succeeded
  error?: string;         // Error message if processing failed
}
```

**Usage Example:**
```typescript
import { generateManifestsWithDiscovery } from '@fsegurai/manifest-generator';

const results: ProcessingResult[] = generateManifestsWithDiscovery('./projects');
results.forEach(result => {
  if (result.processed) {
    console.log(`✅ Successfully processed ${result.name}`);
  } else {
    console.error(`❌ Failed to process ${result.name}: ${result.error}`);
  }
});
```

### `DiscoveryOptions`
Options for customizing project discovery behavior.

```typescript
interface DiscoveryOptions {
  docsSubfolder?: string;     // Name of docs subfolder (default: 'docs')
}
```

**Usage Example:**
```typescript
import { discoverProjects } from '@fsegurai/manifest-generator';

const projects = discoverProjects('./workspace', {
  docsSubfolder: 'documentation'
});
```

### `GenerationOptions`
Options for manifest generation with discovery.

```typescript
interface GenerationOptions {
  project?: string;            // Specific project name to process
  route?: string;             // Specific route path to process
  outputDir?: string;         // Custom output directory
  docsSubfolder?: string;     // Custom docs subfolder name
  autoDetect?: boolean;       // Enable auto-detection (default: true)
}
```

**Usage Example:**
```typescript
import { generateManifestsWithDiscovery } from '@fsegurai/manifest-generator';

// Process specific project
generateManifestsWithDiscovery('./workspace', {
  project: 'my-app',
  outputDir: './dist/manifests'
});

// Process specific route
generateManifestsWithDiscovery('./workspace', {
  route: './docs/api',
  outputDir: './public/data'
});
```

## Function Signatures

### `generateManifest`
```typescript
function generateManifest(projectPath: string): ManifestResult;
```

### `generateManifestsWithDiscovery`
```typescript
function generateManifestsWithDiscovery(
  rootDir: string, 
  options?: GenerationOptions
): ProcessingResult[];
```

### `discoverProjects`
```typescript
function discoverProjects(
  rootDir: string, 
  options?: DiscoveryOptions
): DiscoveredProject[];
```

## Type Guards

### Checking Navigation Item Types
```typescript
function hasPath(item: NavigationItem): item is NavigationItem & { path: string } {
  return typeof item.path === 'string';
}

function hasChildren(item: NavigationItem): item is NavigationItem & { children: NavigationItem[] } {
  return Array.isArray(item.children);
}

// Usage
manifest.forEach(item => {
  if (hasPath(item)) {
    console.log(`Page: ${item.title} -> ${item.path}`);
  } else if (hasChildren(item)) {
    console.log(`Folder: ${item.title} (${item.children.length} children)`);
  }
});
```

## Utility Types

### Extract specific types from interfaces
```typescript
type NavigationPath = NonNullable<NavigationItem['path']>;
type NavigationTags = NonNullable<NavigationItem['tags']>;
type ProjectType = DiscoveredProject['type'];
```

## Integration Examples

### React Component with TypeScript
```typescript
import React, { useState, useEffect } from 'react';
import { NavigationItem, SearchEntry } from '@fsegurai/manifest-generator';

interface DocumentationProps {
  manifestUrl: string;
  searchIndexUrl: string;
}

const Documentation: React.FC<DocumentationProps> = ({ manifestUrl, searchIndexUrl }) => {
  const [manifest, setManifest] = useState<NavigationItem[]>([]);
  const [searchIndex, setSearchIndex] = useState<SearchEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(manifestUrl).then(r => r.json()) as Promise<NavigationItem[]>,
      fetch(searchIndexUrl).then(r => r.json()) as Promise<SearchEntry[]>
    ])
    .then(([manifestData, searchData]) => {
      setManifest(manifestData);
      setSearchIndex(searchData);
      setLoading(false);
    });
  }, [manifestUrl, searchIndexUrl]);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <nav>
        {manifest.map(item => (
          <NavigationItem key={item.title} item={item} />
        ))}
      </nav>
    </div>
  );
};
```

### Node.js Script with TypeScript
```typescript
import { generateManifest, DiscoveredProject, ManifestResult } from '@fsegurai/manifest-generator';
import fs from 'fs/promises';
import path from 'path';

async function buildDocumentation(projects: DiscoveredProject[]): Promise<void> {
  for (const project of projects) {
    try {
      console.log(`Processing ${project.name}...`);
      
      const result: ManifestResult = generateManifest(project.docsPath);
      
      const outputDir = path.join(project.projectPath, 'dist', 'docs');
      await fs.mkdir(outputDir, { recursive: true });
      
      await Promise.all([
        fs.writeFile(
          path.join(outputDir, 'manifest.json'),
          JSON.stringify(result.manifest, null, 2)
        ),
        fs.writeFile(
          path.join(outputDir, 'search-index.json'),
          JSON.stringify(result.searchIndex, null, 2)
        )
      ]);
      
      console.log(`✅ Completed ${project.name}`);
    } catch (error) {
      console.error(`❌ Failed ${project.name}:`, error);
    }
  }
}
```

## Next Steps

- 🔧 **API Functions**: See [Reference](reference.md) for complete function documentation
- 💡 **Usage Examples**: Check [Examples](examples.md) for practical implementations
- 🔗 **Integration**: Visit [Integration](../integration/) for build system setup
