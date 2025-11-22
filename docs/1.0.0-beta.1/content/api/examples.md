---
label: API Examples
tags: ["api", "examples", "advanced", "usage", "batch"]
---

# API Examples

Practical examples showing how to use the Manifest Generator API in different scenarios and applications.

## Basic Usage Examples

### Generate Single Project Manifest

```javascript
import { generateManifest } from '@fsegurai/manifest-generator';
import fs from 'fs';

// Generate manifest for specific documentation path
const result = generateManifest('./docs');

// Save to files
fs.writeFileSync('manifest.json', JSON.stringify(result.manifest, null, 2));
fs.writeFileSync('search-index.json', JSON.stringify(result.searchIndex, null, 2));

console.log(`Generated ${result.manifest.length} navigation items`);
console.log(`Generated ${result.searchIndex.length} search entries`);
```

### Discover and Process Projects

```javascript
import { discoverProjects, generateManifest } from '@fsegurai/manifest-generator';

// Discover all documentation projects
const projects = discoverProjects('./workspace', {
  docsSubfolder: 'documentation'
});

console.log(`Found ${projects.length} documentation projects:`);
projects.forEach(project => {
  console.log(`- ${project.name} (${project.type}) at ${project.docsPath}`);
});

// Process each discovered project
projects.forEach(project => {
  const result = generateManifest(project.docsPath);
  console.log(`Processed ${project.name}: ${result.manifest.length} items`);
});
```

### Batch Processing with Discovery

```javascript
import { generateManifestsWithDiscovery } from '@fsegurai/manifest-generator';

// Process all projects in workspace
const results = generateManifestsWithDiscovery('./workspace', {
  docsSubfolder: 'docs',
  outputDir: './dist/manifests'
});

// Check results
results.forEach(result => {
  if (result.processed) {
    console.log(`✅ Successfully processed ${result.name}`);
  } else {
    console.error(`❌ Failed to process ${result.name}: ${result.error}`);
  }
});
```

## Advanced Usage Examples

### Custom Processing Pipeline

```javascript
import { discoverProjects, generateManifest } from '@fsegurai/manifest-generator';
import fs from 'fs/promises';
import path from 'path';

async function customDocumentationBuilder(rootDir) {
  try {
    // Discover all projects
    const projects = discoverProjects(rootDir);
    console.log(`Found ${projects.length} projects to process`);
    
    // Process each project with custom logic
    for (const project of projects) {
      console.log(`Processing ${project.name}...`);
      
      // Generate manifest
      const result = generateManifest(project.docsPath);
      
      // Add custom metadata
      const enhancedManifest = {
        projectName: project.name,
        generatedAt: new Date().toISOString(),
        projectType: project.type,
        navigation: result.manifest,
        searchData: result.searchIndex
      };
      
      // Custom output directory structure
      const outputDir = path.join(project.projectPath, 'generated', 'docs');
      await fs.mkdir(outputDir, { recursive: true });
      
      // Save enhanced manifest
      await fs.writeFile(
        path.join(outputDir, 'documentation.json'),
        JSON.stringify(enhancedManifest, null, 2)
      );
      
      console.log(`✅ Enhanced manifest saved for ${project.name}`);
    }
  } catch (error) {
    console.error('Build failed:', error);
  }
}

// Usage
customDocumentationBuilder('./my-workspace');
```

### Error Handling and Validation

```javascript
import { generateManifest } from '@fsegurai/manifest-generator';
import fs from 'fs';

function safeGenerateManifest(docsPath, outputPath) {
  try {
    // Validate input path exists
    if (!fs.existsSync(docsPath)) {
      throw new Error(`Documentation path not found: ${docsPath}`);
    }
    
    // Generate manifest
    const result = generateManifest(docsPath);
    
    // Validate results
    if (!Array.isArray(result.manifest)) {
      throw new Error('Invalid manifest structure');
    }
    
    if (!Array.isArray(result.searchIndex)) {
      throw new Error('Invalid search index structure');
    }
    
    // Ensure output directory exists
    fs.mkdirSync(outputPath, { recursive: true });
    
    // Save files with error handling
    const manifestPath = path.join(outputPath, 'manifest.json');
    const searchPath = path.join(outputPath, 'search-index.json');
    
    fs.writeFileSync(manifestPath, JSON.stringify(result.manifest, null, 2));
    fs.writeFileSync(searchPath, JSON.stringify(result.searchIndex, null, 2));
    
    return {
      success: true,
      manifestItems: result.manifest.length,
      searchEntries: result.searchIndex.length,
      files: [manifestPath, searchPath]
    };
    
  } catch (error) {
    console.error(`Failed to generate manifest for ${docsPath}:`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Usage
const result = safeGenerateManifest('./docs', './output');
if (result.success) {
  console.log(`Generated ${result.manifestItems} items, saved to ${result.files.join(', ')}`);
}
```

## Framework Integration Examples

### Express.js API Server

```javascript
import express from 'express';
import { generateManifest, discoverProjects } from '@fsegurai/manifest-generator';

const app = express();

// Dynamic manifest generation endpoint
app.get('/api/docs/manifest', (req, res) => {
  try {
    const result = generateManifest('./docs');
    res.json({
      success: true,
      data: result.manifest,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Dynamic search index endpoint
app.get('/api/docs/search', (req, res) => {
  try {
    const result = generateManifest('./docs');
    res.json({
      success: true,
      data: result.searchIndex,
      count: result.searchIndex.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Project discovery endpoint
app.get('/api/projects', (req, res) => {
  try {
    const projects = discoverProjects('./workspace');
    res.json({
      success: true,
      projects: projects.map(p => ({
        name: p.name,
        type: p.type,
        hasDocumentation: true
      })),
      count: projects.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(3000, () => {
  console.log('Documentation API server running on port 3000');
});
```

### Build Tool Integration

```javascript
// Custom webpack plugin
class ManifestGeneratorPlugin {
  constructor(options = {}) {
    this.options = {
      docsPath: './docs',
      outputPath: './dist',
      ...options
    };
  }
  
  apply(compiler) {
    compiler.hooks.beforeCompile.tapAsync(
      'ManifestGeneratorPlugin',
      async (compilation, callback) => {
        try {
          console.log('Generating documentation manifests...');
          
          const { generateManifest } = await import('@fsegurai/manifest-generator');
          const result = generateManifest(this.options.docsPath);
          
          // Ensure output directory exists
          const fs = require('fs');
          const path = require('path');
          
          if (!fs.existsSync(this.options.outputPath)) {
            fs.mkdirSync(this.options.outputPath, { recursive: true });
          }
          
          // Write files
          fs.writeFileSync(
            path.join(this.options.outputPath, 'manifest.json'),
            JSON.stringify(result.manifest, null, 2)
          );
          
          fs.writeFileSync(
            path.join(this.options.outputPath, 'search-index.json'),
            JSON.stringify(result.searchIndex, null, 2)
          );
          
          console.log(`✅ Generated manifests: ${result.manifest.length} items`);
          callback();
        } catch (error) {
          console.error('❌ Manifest generation failed:', error);
          callback(error);
        }
      }
    );
  }
}

// Webpack configuration
module.exports = {
  // ... other webpack config
  plugins: [
    new ManifestGeneratorPlugin({
      docsPath: './src/docs',
      outputPath: './public/data'
    })
  ]
};
```

### React Hook for Documentation

```javascript
import { useState, useEffect } from 'react';

// Custom hook for loading documentation data
export function useDocumentation(manifestUrl, searchIndexUrl) {
  const [manifest, setManifest] = useState([]);
  const [searchIndex, setSearchIndex] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadDocumentation() {
      try {
        setLoading(true);
        setError(null);

        const [manifestResponse, searchResponse] = await Promise.all([
          fetch(manifestUrl),
          fetch(searchIndexUrl)
        ]);

        if (!manifestResponse.ok || !searchResponse.ok) {
          throw new Error('Failed to load documentation data');
        }

        const [manifestData, searchData] = await Promise.all([
          manifestResponse.json(),
          searchResponse.json()
        ]);

        if (mounted) {
          setManifest(manifestData);
          setSearchIndex(searchData);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    }

    loadDocumentation();

    return () => {
      mounted = false;
    };
  }, [manifestUrl, searchIndexUrl]);

  return { manifest, searchIndex, loading, error };
}

// Usage in React component
function DocumentationApp() {
  const { manifest, searchIndex, loading, error } = useDocumentation(
    '/api/docs/manifest',
    '/api/docs/search'
  );

  if (loading) return <div>Loading documentation...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <nav>
        {manifest.map(item => (
          <NavItem key={item.title} item={item} />
        ))}
      </nav>
      <SearchBox searchIndex={searchIndex} />
    </div>
  );
}
```

## Async/Await Patterns

### Promise-based File Operations

```javascript
import { generateManifest } from '@fsegurai/manifest-generator';
import { promises as fs } from 'fs';
import path from 'path';

async function generateAndSaveManifests(docsPath, outputDir) {
  try {
    // Generate manifests
    console.log(`Generating manifests for ${docsPath}...`);
    const result = generateManifest(docsPath);
    
    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });
    
    // Save files concurrently
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
    
    console.log(`✅ Manifests saved to ${outputDir}`);
    return {
      success: true,
      manifestItems: result.manifest.length,
      searchEntries: result.searchIndex.length
    };
  } catch (error) {
    console.error(`❌ Failed to generate manifests: ${error.message}`);
    throw error;
  }
}

// Usage
async function buildDocs() {
  try {
    await generateAndSaveManifests('./docs', './dist/docs');
    await generateAndSaveManifests('./api-docs', './dist/api');
    console.log('All documentation built successfully!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

buildDocs();
```

## Performance Optimization Examples

### Caching Results

```javascript
import { generateManifest } from '@fsegurai/manifest-generator';
import fs from 'fs';
import path from 'path';

class CachedManifestGenerator {
  constructor(cacheDir = './cache') {
    this.cacheDir = cacheDir;
    this.cache = new Map();
  }
  
  getCacheKey(docsPath) {
    // Use path and last modified time as cache key
    const stats = fs.statSync(docsPath);
    return `${docsPath}-${stats.mtime.getTime()}`;
  }
  
  async getManifest(docsPath) {
    const cacheKey = this.getCacheKey(docsPath);
    
    // Check memory cache first
    if (this.cache.has(cacheKey)) {
      console.log(`Cache hit (memory): ${docsPath}`);
      return this.cache.get(cacheKey);
    }
    
    // Check disk cache
    const cacheFile = path.join(this.cacheDir, `${Buffer.from(cacheKey).toString('base64')}.json`);
    
    if (fs.existsSync(cacheFile)) {
      console.log(`Cache hit (disk): ${docsPath}`);
      const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      this.cache.set(cacheKey, cached);
      return cached;
    }
    
    // Generate new manifest
    console.log(`Generating new manifest: ${docsPath}`);
    const result = generateManifest(docsPath);
    
    // Cache the result
    this.cache.set(cacheKey, result);
    
    // Save to disk cache
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
    fs.writeFileSync(cacheFile, JSON.stringify(result, null, 2));
    
    return result;
  }
}

// Usage
const generator = new CachedManifestGenerator();
const result = await generator.getManifest('./docs');
```

## Next Steps

- 🔧 **Complete API**: See [Reference](reference.md) for all function signatures
- 📘 **TypeScript**: Check [TypeScript](typescript.md) for type definitions
- 🔗 **Integration**: Visit [Integration](../integration/) for build system patterns
- 💡 **More Examples**: Browse [Examples](../examples/) for framework-specific implementations
