# Build Systems Integration

Integrate the Manifest Generator into your build tools and development workflows for automated documentation processing.

## npm Scripts Integration

The simplest way to integrate manifest generation into your project:

```json
{
  "scripts": {
    "docs:build": "manifest-generator --all",
    "docs:dev": "manifest-generator --route ./docs --output ./src/data",
    "docs:watch": "chokidar 'docs/**/*.md' -c 'npm run docs:dev'",
    "docs:prod": "manifest-generator --all --output ./dist/manifests",
    "build": "npm run docs:prod && npm run build:app",
    "dev": "npm run docs:dev && npm run dev:app"
  },
  "devDependencies": {
    "@fsegurai/manifest-generator": "^0.0.0-alpha.2",
    "chokidar-cli": "^3.0.0"
  }
}
```

### Watch Mode Setup

For development workflows with automatic regeneration:

```bash
# Install file watcher
npm install --save-dev chokidar-cli

# Add watch script to package.json
{
  "scripts": {
    "docs:watch": "chokidar 'docs/**/*.md' -c 'manifest-generator --route ./docs'"
  }
}

# Run in development
npm run docs:watch
```

### Pre-commit Hooks

Ensure manifests are always up to date:

```bash
# Install husky
npm install --save-dev husky

# Add pre-commit hook
echo "npx @fsegurai/manifest-generator --all" > .husky/pre-commit
chmod +x .husky/pre-commit
```

## Webpack Integration

### Custom Webpack Plugin

```javascript
// webpack.config.js
const { execSync } = require('child_process');

class ManifestGeneratorPlugin {
  constructor(options = {}) {
    this.options = {
      docsPath: './docs',
      outputPath: './dist/data',
      ...options
    };
  }

  apply(compiler) {
    compiler.hooks.beforeCompile.tapAsync(
      'ManifestGeneratorPlugin',
      (compilation, callback) => {
        try {
          console.log('Generating documentation manifests...');
          execSync(`npx @fsegurai/manifest-generator --route ${this.options.docsPath} --output ${this.options.outputPath}`);
          console.log('✅ Documentation manifests generated');
        } catch (error) {
          console.error('❌ Failed to generate manifests:', error.message);
        }
        callback();
      }
    );
  }
}

module.exports = {
  // ... webpack config
  plugins: [
    new ManifestGeneratorPlugin({
      docsPath: './src/docs',
      outputPath: './public/data'
    })
  ]
};
```

### Programmatic Webpack Integration

```javascript
// webpack.config.js
const { generateManifest } = require('@fsegurai/manifest-generator');
const fs = require('fs');
const path = require('path');

class ProgrammaticManifestPlugin {
  apply(compiler) {
    compiler.hooks.beforeCompile.tapAsync(
      'ProgrammaticManifestPlugin',
      async (compilation, callback) => {
        try {
          const result = generateManifest('./docs');
          
          const outputDir = path.join(__dirname, 'dist', 'data');
          if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
          }
          
          fs.writeFileSync(
            path.join(outputDir, 'manifest.json'),
            JSON.stringify(result.manifest, null, 2)
          );
          
          fs.writeFileSync(
            path.join(outputDir, 'search-index.json'),
            JSON.stringify(result.searchIndex, null, 2)
          );
          
          callback();
        } catch (error) {
          callback(error);
        }
      }
    );
  }
}
```

## Vite Integration

### Vite Plugin

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import { execSync } from 'child_process';

function manifestGenerator(options = {}) {
  const { docsPath = './docs', outputPath = './public/data' } = options;
  
  return {
    name: 'manifest-generator',
    buildStart() {
      try {
        console.log('Generating documentation manifests...');
        execSync(`npx @fsegurai/manifest-generator --route ${docsPath} --output ${outputPath}`);
        console.log('✅ Manifests generated');
      } catch (error) {
        console.error('❌ Manifest generation failed:', error.message);
      }
    }
  };
}

export default defineConfig({
  plugins: [
    manifestGenerator({
      docsPath: './src/docs',
      outputPath: './public/data'
    })
  ]
});
```

### Vite Development Mode

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import { generateManifest } from '@fsegurai/manifest-generator';
import fs from 'fs';

function devManifestGenerator() {
  return {
    name: 'dev-manifest-generator',
    configureServer(server) {
      // Watch for changes in docs directory
      server.ws.on('file-changed', ({ file }) => {
        if (file.includes('/docs/') && file.endsWith('.md')) {
          console.log('Documentation changed, regenerating manifests...');
          try {
            const result = generateManifest('./docs');
            fs.writeFileSync('./public/manifest.json', JSON.stringify(result.manifest, null, 2));
            fs.writeFileSync('./public/search-index.json', JSON.stringify(result.searchIndex, null, 2));
            console.log('✅ Manifests updated');
          } catch (error) {
            console.error('❌ Failed to update manifests:', error);
          }
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [devManifestGenerator()]
});
```

## Rollup Integration

### Rollup Plugin

```javascript
// rollup.config.js
import { execSync } from 'child_process';

function manifestGenerator(options = {}) {
  const { docsPath = './docs', outputPath = './dist' } = options;
  
  return {
    name: 'manifest-generator',
    buildStart() {
      try {
        execSync(`npx @fsegurai/manifest-generator --route ${docsPath} --output ${outputPath}`);
        console.log('✅ Documentation manifests generated');
      } catch (error) {
        console.error('❌ Manifest generation failed:', error.message);
        throw error;
      }
    }
  };
}

export default {
  // ... rollup config
  plugins: [
    manifestGenerator({
      docsPath: './src/docs',
      outputPath: './dist/data'
    })
  ]
};
```

## Parcel Integration

### Parcel Plugin

```javascript
// .parcelrc
{
  "extends": "@parcel/config-default",
  "transformers": {
    "docs/**/*.md": ["parcel-transformer-manifest-generator"]
  }
}
```

```javascript
// parcel-transformer-manifest-generator.js
const { Transformer } = require('@parcel/plugin');
const { generateManifest } = require('@fsegurai/manifest-generator');

module.exports = new Transformer({
  async transform({ asset }) {
    if (asset.filePath.includes('/docs/')) {
      // Trigger manifest generation when docs change
      const result = generateManifest('./docs');
      
      // Add manifests as dependencies
      asset.addDependency({
        specifier: './docs/manifest.json',
        specifierType: 'url'
      });
      
      return [asset];
    }
    return [asset];
  }
});
```

## Gulp Integration

### Gulp Task

```javascript
// gulpfile.js
const gulp = require('gulp');
const { execSync } = require('child_process');

function generateManifests() {
  return new Promise((resolve, reject) => {
    try {
      execSync('npx @fsegurai/manifest-generator --all', { stdio: 'inherit' });
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

function watchDocs() {
  return gulp.watch('docs/**/*.md', generateManifests);
}

gulp.task('docs:build', generateManifests);
gulp.task('docs:watch', gulp.series(generateManifests, watchDocs));
gulp.task('build', gulp.series('docs:build', 'other-build-tasks'));
```

## esbuild Integration

### esbuild Plugin

```javascript
// build.js
const esbuild = require('esbuild');
const { execSync } = require('child_process');

const manifestGeneratorPlugin = {
  name: 'manifest-generator',
  setup(build) {
    build.onStart(() => {
      console.log('Generating documentation manifests...');
      try {
        execSync('npx @fsegurai/manifest-generator --route ./docs --output ./dist');
        console.log('✅ Manifests generated');
      } catch (error) {
        console.error('❌ Manifest generation failed:', error.message);
      }
    });
  }
};

esbuild.build({
  // ... esbuild config
  plugins: [manifestGeneratorPlugin]
});
```

## Environment-Specific Configuration

### Development vs. Production

```javascript
// webpack.config.js
const isProduction = process.env.NODE_ENV === 'production';

const manifestConfig = isProduction
  ? {
      docsPath: './docs',
      outputPath: './dist/manifests',
      command: 'npx @fsegurai/manifest-generator --all --output ./dist/manifests'
    }
  : {
      docsPath: './docs',
      outputPath: './src/data',
      command: 'npx @fsegurai/manifest-generator --route ./docs --output ./src/data'
    };

// Use manifestConfig in your build plugins
```

### Cross-Platform Compatibility

```javascript
// build-docs.js
const { spawn } = require('child_process');
const path = require('path');

function generateManifests() {
  return new Promise((resolve, reject) => {
    const isWindows = process.platform === 'win32';
    const command = isWindows ? 'npx.cmd' : 'npx';
    
    const child = spawn(command, [
      '@fsegurai/manifest-generator',
      '--route', './docs',
      '--output', './dist'
    ], {
      stdio: 'inherit',
      shell: isWindows
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Manifest generation failed with code ${code}`));
      }
    });
  });
}

module.exports = generateManifests;
```

## Performance Optimization

### Parallel Processing

```javascript
// For multiple documentation sources
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

if (isMainThread) {
  // Main thread - coordinate workers
  const workers = [
    './docs/user-guide',
    './docs/api-reference',
    './docs/tutorials'
  ].map(docsPath => {
    return new Promise((resolve, reject) => {
      const worker = new Worker(__filename, {
        workerData: { docsPath }
      });
      worker.on('message', resolve);
      worker.on('error', reject);
    });
  });
  
  Promise.all(workers).then(() => {
    console.log('All documentation manifests generated');
  });
} else {
  // Worker thread - generate manifest
  const { execSync } = require('child_process');
  const { docsPath } = workerData;
  
  try {
    execSync(`npx @fsegurai/manifest-generator --route ${docsPath}`);
    parentPort.postMessage(`Completed: ${docsPath}`);
  } catch (error) {
    parentPort.postMessage(`Failed: ${docsPath} - ${error.message}`);
  }
}
```

## Next Steps

- 🚀 **Framework Integration**: See [Frameworks](frameworks.md) for React, Vue, Angular setup
- ⚙️ **CI/CD**: Check [CI/CD](ci-cd.md) for automated pipeline integration
- 💡 **Examples**: Browse [Examples](../examples/) for complete project setups
