# Framework Integration

Integrate the Manifest Generator with popular frontend frameworks and libraries for seamless documentation workflows.

## React Integration

### Create React App Integration

```javascript
// scripts/build-docs.js
const { execSync } = require('child_process');

function buildDocs() {
  console.log('Generating documentation manifests...');
  execSync('npx @fsegurai/manifest-generator --route ./public/docs', {
    stdio: 'inherit'
  });
}

if (process.env.NODE_ENV === 'production') {
  buildDocs();
}

module.exports = buildDocs;
```

```json
// package.json
{
  "scripts": {
    "prebuild": "node scripts/build-docs.js",
    "build": "react-scripts build"
  }
}
```

### Custom React Hook

```javascript
// hooks/useDocumentation.js
import { useState, useEffect } from 'react';

export function useDocumentation() {
  const [manifest, setManifest] = useState([]);
  const [searchIndex, setSearchIndex] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch('/docs/manifest.json').then(r => r.json()),
      fetch('/docs/search-index.json').then(r => r.json())
    ])
    .then(([manifestData, searchData]) => {
      setManifest(manifestData);
      setSearchIndex(searchData);
      setLoading(false);
    })
    .catch(err => {
      setError(err);
      setLoading(false);
    });
  }, []);

  return { manifest, searchIndex, loading, error };
}
```

### React Documentation Component

```jsx
// components/DocumentationNav.js
import React from 'react';
import { useDocumentation } from '../hooks/useDocumentation';

function DocumentationNav() {
  const { manifest, loading, error } = useDocumentation();

  if (loading) return <div>Loading documentation...</div>;
  if (error) return <div>Error loading documentation: {error.message}</div>;

  const renderNav = (items) => (
    <ul className="documentation-nav">
      {items.map(item => (
        <li key={item.path || item.title}>
          {item.path ? (
            <a href={`/docs/${item.path}`}>{item.title}</a>
          ) : (
            <span className="nav-folder">{item.title}</span>
          )}
          {item.children && renderNav(item.children)}
        </li>
      ))}
    </ul>
  );

  return (
    <nav>
      {renderNav(manifest)}
    </nav>
  );
}

export default DocumentationNav;
```

## Next.js Integration

### API Route for Dynamic Generation

```javascript
// pages/api/docs/generate.js
import { generateManifest } from '@fsegurai/manifest-generator';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const docsPath = path.join(process.cwd(), 'docs');
    const result = generateManifest(docsPath);
    
    // Save to public directory
    const publicPath = path.join(process.cwd(), 'public');
    fs.writeFileSync(
      path.join(publicPath, 'manifest.json'),
      JSON.stringify(result.manifest, null, 2)
    );
    fs.writeFileSync(
      path.join(publicPath, 'search-index.json'),
      JSON.stringify(result.searchIndex, null, 2)
    );

    res.json({ success: true, files: ['manifest.json', 'search-index.json'] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

### Build-time Generation

```javascript
// next.config.js
const { execSync } = require('child_process');

module.exports = {
  webpack: (config, { isServer, dev }) => {
    if (isServer && !dev) {
      // Generate manifests during production build
      execSync('npx @fsegurai/manifest-generator --route ./docs --output ./public');
    }
    return config;
  }
};
```

### Next.js Static Generation

```javascript
// pages/docs/[...slug].js
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

export default function DocsPage({ manifest }) {
  const router = useRouter();
  const { slug } = router.query;
  
  return (
    <div className="docs-layout">
      <aside>
        <DocumentationNav manifest={manifest} />
      </aside>
      <main>
        {/* Render markdown content based on slug */}
      </main>
    </div>
  );
}

export async function getStaticProps() {
  const fs = require('fs');
  const manifest = JSON.parse(
    fs.readFileSync('./public/docs/manifest.json', 'utf8')
  );
  
  return { props: { manifest } };
}

export async function getStaticPaths() {
  const fs = require('fs');
  const searchIndex = JSON.parse(
    fs.readFileSync('./public/docs/search-index.json', 'utf8')
  );
  
  const paths = searchIndex.map(item => ({
    params: { slug: item.path.split('/') }
  }));
  
  return { paths, fallback: false };
}
```

## Vue.js Integration

### Vue Plugin

```javascript
// plugins/manifest-generator.js
import { generateManifest } from '@fsegurai/manifest-generator';

export default {
  install(app, options = {}) {
    const { docsPath = './docs' } = options;
    
    app.config.globalProperties.$generateManifest = () => {
      return generateManifest(docsPath);
    };
    
    // Provide reactive documentation data
    app.provide('documentation', {
      async loadDocs() {
        const response = await fetch('/docs/manifest.json');
        return response.json();
      }
    });
  }
};
```

```javascript
// main.js
import { createApp } from 'vue';
import App from './App.vue';
import manifestGenerator from './plugins/manifest-generator';

const app = createApp(App);
app.use(manifestGenerator, { docsPath: './docs' });
app.mount('#app');
```

### Vue Composition API

```vue
<!-- composables/useDocumentation.js -->
<script>
import { ref, onMounted } from 'vue';

export function useDocumentation() {
  const manifest = ref([]);
  const searchIndex = ref([]);
  const loading = ref(true);
  const error = ref(null);

  const loadDocumentation = async () => {
    try {
      const [manifestRes, searchRes] = await Promise.all([
        fetch('/docs/manifest.json'),
        fetch('/docs/search-index.json')
      ]);
      
      manifest.value = await manifestRes.json();
      searchIndex.value = await searchRes.json();
    } catch (err) {
      error.value = err;
    } finally {
      loading.value = false;
    }
  };

  onMounted(loadDocumentation);

  return {
    manifest,
    searchIndex,
    loading,
    error,
    loadDocumentation
  };
}
</script>
```

### Vue Documentation Component

```vue
<!-- components/DocumentationSidebar.vue -->
<template>
  <nav class="docs-sidebar">
    <ul v-if="!loading">
      <li v-for="item in manifest" :key="item.path || item.title">
        <router-link 
          v-if="item.path" 
          :to="`/docs/${item.path}`"
          class="nav-link"
        >
          {{ item.title }}
        </router-link>
        <span v-else class="nav-folder">{{ item.title }}</span>
        
        <ul v-if="item.children" class="nav-children">
          <li v-for="child in item.children" :key="child.path">
            <router-link :to="`/docs/${child.path}`">
              {{ child.title }}
            </router-link>
          </li>
        </ul>
      </li>
    </ul>
    <div v-else>Loading documentation...</div>
  </nav>
</template>

<script>
import { useDocumentation } from '../composables/useDocumentation';

export default {
  name: 'DocumentationSidebar',
  setup() {
    const { manifest, loading, error } = useDocumentation();
    
    return {
      manifest,
      loading,
      error
    };
  }
};
</script>
```

## Angular Integration

### Angular Service

```typescript
// services/documentation.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, combineLatest } from 'rxjs';

export interface NavigationItem {
  label: string;
  path?: string;
  tags?: string[];
  children?: NavigationItem[];
}

export interface SearchEntry {
  label: string;
  path: string;
  tags?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class DocumentationService {
  constructor(private http: HttpClient) {}

  getManifest(): Observable<NavigationItem[]> {
    return this.http.get<NavigationItem[]>('/assets/docs/manifest.json');
  }

  getSearchIndex(): Observable<SearchEntry[]> {
    return this.http.get<SearchEntry[]>('/assets/docs/search-index.json');
  }

  getDocumentation(): Observable<[NavigationItem[], SearchEntry[]]> {
    return combineLatest([this.getManifest(), this.getSearchIndex()]);
  }
}
```

### Angular Component

```typescript
// components/documentation-nav.component.ts
import { Component, OnInit } from '@angular/core';
import { DocumentationService, NavigationItem } from '../services/documentation.service';

@Component({
  selector: 'app-documentation-nav',
  template: `
    <nav class="documentation-nav">
      <ul>
        <li *ngFor="let item of manifest">
          <a *ngIf="item.path" [routerLink]="'/docs/' + item.path">
            {{ item.title }}
          </a>
          <span *ngIf="!item.path" class="nav-folder">{{ item.title }}</span>
          
          <ul *ngIf="item.children">
            <li *ngFor="let child of item.children">
              <a [routerLink]="'/docs/' + child.path">{{ child.title }}</a>
            </li>
          </ul>
        </li>
      </ul>
    </nav>
  `
})
export class DocumentationNavComponent implements OnInit {
  manifest: NavigationItem[] = [];

  constructor(private docService: DocumentationService) {}

  ngOnInit() {
    this.docService.getManifest().subscribe(
      manifest => this.manifest = manifest
    );
  }
}
```

### Angular Build Integration

```javascript
// angular.json
{
  "projects": {
    "your-app": {
      "architect": {
        "build": {
          "builder": "@angular-devkit/build-angular:browser",
          "options": {
            "scripts": ["scripts/generate-docs.js"]
          }
        }
      }
    }
  }
}
```

## Svelte Integration

### Svelte Store

```javascript
// stores/documentation.js
import { writable } from 'svelte/store';

function createDocumentationStore() {
  const { subscribe, set, update } = writable({
    manifest: [],
    searchIndex: [],
    loading: true,
    error: null
  });

  return {
    subscribe,
    async load() {
      try {
        update(state => ({ ...state, loading: true }));
        
        const [manifestRes, searchRes] = await Promise.all([
          fetch('/docs/manifest.json'),
          fetch('/docs/search-index.json')
        ]);
        
        const manifest = await manifestRes.json();
        const searchIndex = await searchRes.json();
        
        set({
          manifest,
          searchIndex,
          loading: false,
          error: null
        });
      } catch (error) {
        update(state => ({ 
          ...state, 
          loading: false, 
          error: error.message 
        }));
      }
    }
  };
}

export const documentation = createDocumentationStore();
```

### Svelte Component

```svelte
<!-- DocumentationNav.svelte -->
<script>
  import { onMount } from 'svelte';
  import { documentation } from '../stores/documentation.js';

  onMount(() => {
    documentation.load();
  });
</script>

{#if $documentation.loading}
  <div>Loading documentation...</div>
{:else if $documentation.error}
  <div>Error: {$documentation.error}</div>
{:else}
  <nav class="documentation-nav">
    <ul>
      {#each $documentation.manifest as item}
        <li>
          {#if item.path}
            <a href="/docs/{item.path}">{item.title}</a>
          {:else}
            <span class="nav-folder">{item.title}</span>
          {/if}
          
          {#if item.children}
            <ul>
              {#each item.children as child}
                <li>
                  <a href="/docs/{child.path}">{child.title}</a>
                </li>
              {/each}
            </ul>
          {/if}
        </li>
      {/each}
    </ul>
  </nav>
{/if}
```

## Express.js Backend Integration

### API Endpoints

```javascript
// server/routes/documentation.js
const express = require('express');
const { generateManifest } = require('@fsegurai/manifest-generator');
const router = express.Router();

// Get current manifest
router.get('/manifest', (req, res) => {
  try {
    const result = generateManifest('./docs');
    res.json({
      success: true,
      data: result.manifest,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get search index
router.get('/search', (req, res) => {
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

// Regenerate documentation
router.post('/generate', (req, res) => {
  try {
    const result = generateManifest('./docs');
    // Save to files if needed
    res.json({
      success: true,
      generated: {
        manifest: result.manifest.length,
        searchIndex: result.searchIndex.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
```

## Framework-Agnostic Patterns

### Vanilla JavaScript Integration

```javascript
// docs-loader.js
class DocumentationLoader {
  constructor(manifestUrl, searchIndexUrl) {
    this.manifestUrl = manifestUrl;
    this.searchIndexUrl = searchIndexUrl;
    this.manifest = [];
    this.searchIndex = [];
    this.listeners = [];
  }

  async load() {
    try {
      const [manifestRes, searchRes] = await Promise.all([
        fetch(this.manifestUrl),
        fetch(this.searchIndexUrl)
      ]);
      
      this.manifest = await manifestRes.json();
      this.searchIndex = await searchRes.json();
      
      this.notifyListeners('loaded', {
        manifest: this.manifest,
        searchIndex: this.searchIndex
      });
    } catch (error) {
      this.notifyListeners('error', error);
    }
  }

  on(event, callback) {
    this.listeners.push({ event, callback });
  }

  notifyListeners(event, data) {
    this.listeners
      .filter(listener => listener.event === event)
      .forEach(listener => listener.callback(data));
  }
}

// Usage
const docs = new DocumentationLoader('/docs/manifest.json', '/docs/search-index.json');
docs.on('loaded', ({ manifest }) => {
  console.log('Documentation loaded:', manifest);
});
docs.load();
```

## Next Steps

- ⚙️ **CI/CD Integration**: See [CI/CD](ci-cd.md) for automated pipeline setup
- 🔧 **Build Systems**: Check [Build Systems](build-systems.md) for build tool integration
- 💡 **Examples**: Browse [Examples](../examples/) for complete framework implementations
