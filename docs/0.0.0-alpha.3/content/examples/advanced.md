# Advanced Usage

Complex scenarios and advanced workflows for using the Manifest Generator in sophisticated documentation systems.

## Multi-Language Documentation

### Internationalization Support

**Project Structure:**
```
docs/
├── en/
│   ├── README.md
│   ├── guides/
│   │   └── getting-started.md
│   └── api/
│       └── reference.md
├── es/
│   ├── README.md
│   ├── guias/
│   │   └── comenzando.md
│   └── api/
│       └── referencia.md
└── fr/
    ├── README.md
    ├── guides/
    │   └── demarrage.md
    └── api/
        └── reference.md
```

**Processing Each Language:**
```bash
# Generate manifests for each language
npx @fsegurai/manifest-generator --route ./docs/en --output ./public/data/en
npx @fsegurai/manifest-generator --route ./docs/es --output ./public/data/es
npx @fsegurai/manifest-generator --route ./docs/fr --output ./public/data/fr
```

**Automated Multi-Language Build:**
```bash
#!/bin/bash
# build-multilang-docs.sh

languages=("en" "es" "fr")
base_path="./docs"
output_path="./public/data"

for lang in "${languages[@]}"; do
  echo "Processing $lang documentation..."
  npx @fsegurai/manifest-generator \
    --route "$base_path/$lang" \
    --output "$output_path/$lang"
  
  echo "✅ Completed $lang"
done

echo "🌍 Multi-language documentation build complete!"
```

## Versioned Documentation

### Version-Based Structure

**Project Structure:**
```
docs/
├── v1.0/
│   ├── README.md
│   ├── api.md
│   └── guides/
│       └── migration.md
├── v2.0/
│   ├── README.md
│   ├── api.md
│   └── breaking-changes.md
├── v3.0/
│   ├── README.md
│   ├── new-features.md
│   └── api/
│       ├── rest.md
│       └── graphql.md
└── latest/ -> v3.0/
```

**Version Processing Script:**
```javascript
// scripts/build-versioned-docs.js
import { generateManifest } from '@fsegurai/manifest-generator';
import fs from 'fs';
import path from 'path';

const versions = ['v1.0', 'v2.0', 'v3.0', 'latest'];
const docsRoot = './docs';
const outputRoot = './public/versions';

async function buildVersionedDocs() {
  const versionInfo = {};
  
  for (const version of versions) {
    console.log(`Building documentation for ${version}...`);
    
    try {
      const versionPath = path.join(docsRoot, version);
      const result = generateManifest(versionPath);
      
      // Create version-specific output directory
      const outputDir = path.join(outputRoot, version);
      fs.mkdirSync(outputDir, { recursive: true });
      
      // Save manifests
      fs.writeFileSync(
        path.join(outputDir, 'manifest.json'),
        JSON.stringify(result.manifest, null, 2)
      );
      
      fs.writeFileSync(
        path.join(outputDir, 'search-index.json'),
        JSON.stringify(result.searchIndex, null, 2)
      );
      
      // Collect version metadata
      versionInfo[version] = {
        pages: result.manifest.length,
        searchEntries: result.searchIndex.length,
        lastUpdated: new Date().toISOString()
      };
      
      console.log(`✅ ${version}: ${result.manifest.length} pages`);
    } catch (error) {
      console.error(`❌ Failed to build ${version}:`, error.message);
    }
  }
  
  // Save version index
  fs.writeFileSync(
    path.join(outputRoot, 'versions.json'),
    JSON.stringify(versionInfo, null, 2)
  );
  
  console.log('🚀 Versioned documentation build complete!');
}

buildVersionedDocs();
```

## Custom Manifest Processing

### Post-Processing Pipeline

```javascript
// scripts/advanced-manifest-processor.js
import { generateManifest } from '@fsegurai/manifest-generator';
import fs from 'fs';
import path from 'path';

class AdvancedManifestProcessor {
  constructor(options = {}) {
    this.options = {
      addMetadata: true,
      generateSitemap: true,
      createCategories: true,
      validateLinks: true,
      ...options
    };
  }

  async process(docsPath, outputPath) {
    // Generate base manifest
    const result = generateManifest(docsPath);
    
    // Apply post-processing steps
    const enhanced = await this.enhanceManifest(result, docsPath);
    
    // Save enhanced manifest
    await this.saveResults(enhanced, outputPath);
    
    return enhanced;
  }

  async enhanceManifest(result, docsPath) {
    let enhanced = { ...result };

    if (this.options.addMetadata) {
      enhanced = await this.addMetadata(enhanced, docsPath);
    }

    if (this.options.createCategories) {
      enhanced = this.createCategories(enhanced);
    }

    if (this.options.generateSitemap) {
      enhanced.sitemap = this.generateSitemap(enhanced.manifest);
    }

    if (this.options.validateLinks) {
      enhanced.linkValidation = await this.validateLinks(enhanced, docsPath);
    }

    return enhanced;
  }

  async addMetadata(result, docsPath) {
    const stats = fs.statSync(docsPath);
    
    return {
      ...result,
      metadata: {
        generatedAt: new Date().toISOString(),
        docsPath,
        totalPages: result.searchIndex.length,
        lastModified: stats.mtime.toISOString(),
        version: process.env.DOCS_VERSION || '1.0.0'
      }
    };
  }

  createCategories(result) {
    const categories = new Map();
    
    result.searchIndex.forEach(item => {
      item.tags.forEach(tag => {
        if (!categories.has(tag)) {
          categories.set(tag, []);
        }
        categories.get(tag).push(item);
      });
    });

    return {
      ...result,
      categories: Object.fromEntries(categories)
    };
  }

  generateSitemap(manifest) {
    const urls = [];
    
    const traverse = (items, basePath = '') => {
      items.forEach(item => {
        if (item.path) {
          urls.push({
            loc: `${basePath}/${item.path}`,
            lastmod: new Date().toISOString(),
            changefreq: 'weekly',
            priority: item.path === 'README' ? '1.0' : '0.8'
          });
        }
        
        if (item.children) {
          traverse(item.children, basePath);
        }
      });
    };
    
    traverse(manifest);
    return urls;
  }

  async validateLinks(result, docsPath) {
    const issues = [];
    
    for (const item of result.searchIndex) {
      const filePath = path.join(docsPath, `${item.path}.md`);
      
      if (!fs.existsSync(filePath)) {
        issues.push({
          type: 'missing-file',
          item: item.title,
          path: item.path
        });
      }
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  }

  async saveResults(enhanced, outputPath) {
    fs.mkdirSync(outputPath, { recursive: true });
    
    // Save enhanced manifest
    fs.writeFileSync(
      path.join(outputPath, 'manifest.json'),
      JSON.stringify(enhanced.manifest, null, 2)
    );
    
    // Save search index
    fs.writeFileSync(
      path.join(outputPath, 'search-index.json'),
      JSON.stringify(enhanced.searchIndex, null, 2)
    );
    
    // Save metadata
    if (enhanced.metadata) {
      fs.writeFileSync(
        path.join(outputPath, 'metadata.json'),
        JSON.stringify(enhanced.metadata, null, 2)
      );
    }
    
    // Save categories
    if (enhanced.categories) {
      fs.writeFileSync(
        path.join(outputPath, 'categories.json'),
        JSON.stringify(enhanced.categories, null, 2)
      );
    }
    
    // Save sitemap
    if (enhanced.sitemap) {
      fs.writeFileSync(
        path.join(outputPath, 'sitemap.json'),
        JSON.stringify(enhanced.sitemap, null, 2)
      );
    }
  }
}

// Usage
const processor = new AdvancedManifestProcessor({
  addMetadata: true,
  generateSitemap: true,
  createCategories: true,
  validateLinks: true
});

processor.process('./docs', './dist/enhanced');
```

## Large-Scale Documentation Management

### Enterprise Documentation System

```javascript
// enterprise-docs-manager.js
import { discoverProjects, generateManifest } from '@fsegurai/manifest-generator';
import fs from 'fs';
import path from 'path';
import { Worker } from 'worker_threads';

class EnterpriseDocsManager {
  constructor(options = {}) {
    this.options = {
      maxWorkers: 4,
      batchSize: 10,
      retryAttempts: 3,
      outputFormat: 'json',
      ...options
    };
  }

  async processEnterprise(rootDir, outputDir) {
    console.log('🏢 Starting enterprise documentation processing...');
    
    // Discover all projects
    const projects = discoverProjects(rootDir);
    console.log(`📊 Found ${projects.length} documentation projects`);
    
    // Process in batches using workers
    const results = await this.processBatches(projects, outputDir);
    
    // Generate master index
    const masterIndex = this.generateMasterIndex(results);
    
    // Save master index
    fs.writeFileSync(
      path.join(outputDir, 'master-index.json'),
      JSON.stringify(masterIndex, null, 2)
    );
    
    console.log('🎉 Enterprise documentation processing complete!');
    return results;
  }

  async processBatches(projects, outputDir) {
    const results = [];
    const batches = this.createBatches(projects, this.options.batchSize);
    
    for (let i = 0; i < batches.length; i++) {
      console.log(`📦 Processing batch ${i + 1}/${batches.length}`);
      
      const batchPromises = batches[i].map(project => 
        this.processProjectWithWorker(project, outputDir)
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults);
    }
    
    return results;
  }

  async processProjectWithWorker(project, outputDir) {
    return new Promise((resolve, reject) => {
      const worker = new Worker('./docs-worker.js', {
        workerData: { project, outputDir }
      });
      
      worker.on('message', resolve);
      worker.on('error', reject);
      worker.on('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`Worker stopped with exit code ${code}`));
        }
      });
    });
  }

  createBatches(items, batchSize) {
    const batches = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  generateMasterIndex(results) {
    const masterIndex = {
      generatedAt: new Date().toISOString(),
      totalProjects: results.length,
      successful: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length,
      projects: {}
    };

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const { name, manifest, searchIndex } = result.value;
        masterIndex.projects[name] = {
          status: 'success',
          pages: manifest.length,
          searchEntries: searchIndex.length,
          manifestPath: `${name}/manifest.json`,
          searchIndexPath: `${name}/search-index.json`
        };
      } else {
        masterIndex.projects[`project-${index}`] = {
          status: 'failed',
          error: result.reason.message
        };
      }
    });

    return masterIndex;
  }
}
```

**Worker File (`docs-worker.js`):**
```javascript
// docs-worker.js
import { parentPort, workerData } from 'worker_threads';
import { generateManifest } from '@fsegurai/manifest-generator';
import fs from 'fs';
import path from 'path';

const { project, outputDir } = workerData;

try {
  // Generate manifest for this project
  const result = generateManifest(project.docsPath);
  
  // Create project output directory
  const projectOutputDir = path.join(outputDir, project.name);
  fs.mkdirSync(projectOutputDir, { recursive: true });
  
  // Save files
  fs.writeFileSync(
    path.join(projectOutputDir, 'manifest.json'),
    JSON.stringify(result.manifest, null, 2)
  );
  
  fs.writeFileSync(
    path.join(projectOutputDir, 'search-index.json'),
    JSON.stringify(result.searchIndex, null, 2)
  );
  
  parentPort.postMessage({
    name: project.name,
    manifest: result.manifest,
    searchIndex: result.searchIndex,
    status: 'success'
  });
  
} catch (error) {
  parentPort.postMessage({
    name: project.name,
    status: 'error',
    error: error.message
  });
}
```

## Custom Output Formats

### Multiple Format Generator

```javascript
// multi-format-generator.js
import { generateManifest } from '@fsegurai/manifest-generator';
import fs from 'fs';
import path from 'path';

class MultiFormatGenerator {
  constructor() {
    this.formats = {
      json: this.generateJSON.bind(this),
      xml: this.generateXML.bind(this),
      yaml: this.generateYAML.bind(this),
      csv: this.generateCSV.bind(this),
      html: this.generateHTML.bind(this)
    };
  }

  async generateAll(docsPath, outputDir, formats = ['json']) {
    const result = generateManifest(docsPath);
    const outputs = {};

    for (const format of formats) {
      if (this.formats[format]) {
        outputs[format] = await this.formats[format](result, outputDir);
      }
    }

    return outputs;
  }

  generateJSON(result, outputDir) {
    const files = {
      manifest: path.join(outputDir, 'manifest.json'),
      searchIndex: path.join(outputDir, 'search-index.json')
    };

    fs.writeFileSync(files.manifest, JSON.stringify(result.manifest, null, 2));
    fs.writeFileSync(files.searchIndex, JSON.stringify(result.searchIndex, null, 2));

    return files;
  }

  generateXML(result, outputDir) {
    const manifestXml = this.toXML('manifest', result.manifest);
    const searchIndexXml = this.toXML('searchIndex', result.searchIndex);

    const files = {
      manifest: path.join(outputDir, 'manifest.xml'),
      searchIndex: path.join(outputDir, 'search-index.xml')
    };

    fs.writeFileSync(files.manifest, manifestXml);
    fs.writeFileSync(files.searchIndex, searchIndexXml);

    return files;
  }

  generateYAML(result, outputDir) {
    const yaml = require('js-yaml');
    
    const files = {
      manifest: path.join(outputDir, 'manifest.yaml'),
      searchIndex: path.join(outputDir, 'search-index.yaml')
    };

    fs.writeFileSync(files.manifest, yaml.dump(result.manifest));
    fs.writeFileSync(files.searchIndex, yaml.dump(result.searchIndex));

    return files;
  }

  generateCSV(result, outputDir) {
    const manifestCsv = this.toCSV(result.searchIndex);
    const file = path.join(outputDir, 'documentation.csv');
    
    fs.writeFileSync(file, manifestCsv);
    return { csv: file };
  }

  generateHTML(result, outputDir) {
    const html = this.toHTML(result.manifest);
    const file = path.join(outputDir, 'navigation.html');
    
    fs.writeFileSync(file, html);
    return { html: file };
  }

  toXML(rootName, data) {
    // Simple XML conversion (use a proper library in production)
    const xmlEscape = str => str.replace(/[<>&'"]/g, c => 
      ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));
    
    const traverse = (obj, indent = 0) => {
      const spaces = '  '.repeat(indent);
      if (Array.isArray(obj)) {
        return obj.map(item => `${spaces}<item>\n${traverse(item, indent + 1)}\n${spaces}</item>`).join('\n');
      } else if (typeof obj === 'object') {
        return Object.entries(obj).map(([key, value]) => 
          `${spaces}<${key}>${typeof value === 'object' ? '\n' + traverse(value, indent + 1) + '\n' + spaces : xmlEscape(String(value))}</${key}>`
        ).join('\n');
      }
      return xmlEscape(String(obj));
    };

    return `<?xml version="1.0" encoding="UTF-8"?>\n<${rootName}>\n${traverse(data, 1)}\n</${rootName}>`;
  }

  toCSV(searchIndex) {
    const headers = ['Title', 'Path', 'Tags'];
    const rows = searchIndex.map(item => [
      `"${item.title.replace(/"/g, '""')}"`,
      `"${item.path}"`,
      `"${(item.tags || []).join(', ')}"`
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  toHTML(manifest) {
    const traverse = (items) => {
      return '<ul>' + items.map(item => {
        let html = '<li>';
        if (item.path) {
          html += `<a href="/docs/${item.path}">${item.title}</a>`;
        } else {
          html += `<span class="folder">${item.title}</span>`;
        }
        if (item.children) {
          html += traverse(item.children);
        }
        html += '</li>';
        return html;
      }).join('') + '</ul>';
    };

    return `<!DOCTYPE html>
<html>
<head>
  <title>Documentation Navigation</title>
  <style>
    .folder { font-weight: bold; color: #666; }
    ul { margin-left: 1rem; }
    a { text-decoration: none; color: #0066cc; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h1>Documentation Navigation</h1>
  ${traverse(manifest)}
</body>
</html>`;
  }
}

// Usage
const generator = new MultiFormatGenerator();
generator.generateAll('./docs', './output', ['json', 'xml', 'yaml', 'csv', 'html']);
```

## Performance Optimization

### Caching Strategy

```javascript
// cached-generator.js
import { generateManifest } from '@fsegurai/manifest-generator';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

class CachedManifestGenerator {
  constructor(cacheDir = './.manifest-cache') {
    this.cacheDir = cacheDir;
    this.ensureCacheDir();
  }

  ensureCacheDir() {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  async generateWithCache(docsPath) {
    const cacheKey = await this.getCacheKey(docsPath);
    const cachedResult = this.getCachedResult(cacheKey);

    if (cachedResult) {
      console.log('📦 Using cached manifest');
      return cachedResult;
    }

    console.log('🔄 Generating new manifest');
    const result = generateManifest(docsPath);
    
    this.cacheResult(cacheKey, result);
    return result;
  }

  async getCacheKey(docsPath) {
    const files = this.getAllMarkdownFiles(docsPath);
    const fileHashes = await Promise.all(
      files.map(async file => {
        const content = fs.readFileSync(file);
        const stats = fs.statSync(file);
        return `${file}:${stats.mtime.getTime()}:${crypto.createHash('md5').update(content).digest('hex')}`;
      })
    );

    return crypto.createHash('md5').update(fileHashes.join('|')).digest('hex');
  }

  getAllMarkdownFiles(dir) {
    const files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...this.getAllMarkdownFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }

    return files;
  }

  getCachedResult(cacheKey) {
    const cacheFile = path.join(this.cacheDir, `${cacheKey}.json`);
    
    if (fs.existsSync(cacheFile)) {
      try {
        return JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      } catch {
        // Invalid cache file, ignore
      }
    }
    
    return null;
  }

  cacheResult(cacheKey, result) {
    const cacheFile = path.join(this.cacheDir, `${cacheKey}.json`);
    fs.writeFileSync(cacheFile, JSON.stringify(result, null, 2));
  }

  clearCache() {
    const files = fs.readdirSync(this.cacheDir);
    files.forEach(file => {
      fs.unlinkSync(path.join(this.cacheDir, file));
    });
    console.log('🗑️ Cache cleared');
  }
}
```

## Next Steps

These advanced examples demonstrate sophisticated usage patterns for enterprise and large-scale documentation systems. Key takeaways:

- **Scalability**: Use workers and batching for large documentation sets
- **Internationalization**: Process multiple languages systematically
- **Versioning**: Maintain multiple documentation versions
- **Custom Processing**: Extend functionality with post-processing pipelines
- **Performance**: Implement caching for faster repeated builds
- **Flexibility**: Generate multiple output formats for different use cases

For production implementations, consider:

- 🔒 **Security**: Validate inputs and sanitize outputs
- 📊 **Monitoring**: Add a logging and metrics collection
- 🔄 **Recovery**: Implement retry logic and fallback strategies
- 🧪 **Testing**: Add comprehensive test coverage
- 📖 **Documentation**: Document your custom workflows
