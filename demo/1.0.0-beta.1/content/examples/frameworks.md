# Framework Examples

Real-world examples showing how to integrate the Manifest Generator with popular frontend frameworks and static site generators.

## React Examples

### Create React App Integration

**Setup:**
```bash
# Create React app with documentation
npx create-react-app my-docs-site
cd my-docs-site

# Create docs structure
mkdir public/docs
echo "# Welcome" > public/docs/README.md
echo "# Getting Started" > public/docs/getting-started.md
mkdir public/docs/components
echo "# Button Component" > public/docs/components/button.md

# Generate manifests
npx @fsegurai/manifest-generator --route ./public/docs
```

**React Component:**
```jsx
// src/DocumentationNav.js
import React, { useState, useEffect } from 'react';

function DocumentationNav() {
  const [manifest, setManifest] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/docs/manifest.json')
      .then(res => res.json())
      .then(data => {
        setManifest(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load manifest:', err);
        setLoading(false);
      });
  }, []);

  const renderNav = (items) => (
    <ul className="documentation-nav">
      {items.map(item => (
        <li key={item.path || item.title}>
          {item.path ? (
            <a href={`/docs/${item.path}`} className="nav-link">
              {item.title}
            </a>
          ) : (
            <span className="nav-folder">{item.title}</span>
          )}
          {item.children && (
            <ul className="nav-children">
              {renderNav(item.children)}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );

  if (loading) return <div>Loading documentation...</div>;

  return (
    <nav className="documentation-nav">
      {renderNav(manifest)}
    </nav>
  );
}

export default DocumentationNav;
```

**Custom Hook for Documentation:**
```jsx
// src/hooks/useDocumentation.js
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

**Search Component:**
```jsx
// src/components/DocumentationSearch.js
import React, { useState } from 'react';
import { useDocumentation } from '../hooks/useDocumentation';

function DocumentationSearch() {
  const { searchIndex, loading } = useDocumentation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = (searchQuery) => {
    setQuery(searchQuery);
    
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    const filtered = searchIndex.filter(entry =>
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.tags.some(tag => 
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );

    setResults(filtered);
  };

  if (loading) return <div>Loading search...</div>;

  return (
    <div className="documentation-search">
      <input
        type="text"
        placeholder="Search documentation..."
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        className="search-input"
      />
      
      {results.length > 0 && (
        <div className="search-results">
          {results.map(result => (
            <div key={result.path} className="search-result">
              <a href={`/docs/${result.path}`} className="result-title">
                {result.title}
              </a>
              <div className="result-tags">
                {result.tags.map(tag => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DocumentationSearch;
```

## Next.js Examples

### Static Generation with Next.js

**Setup:**
```bash
# Next.js project with docs
npx create-next-app@latest my-next-docs
cd my-next-docs

# Create docs in public folder
mkdir -p public/docs/guides
echo "# Introduction" > public/docs/README.md
echo "# Quick Start" > public/docs/guides/quick-start.md

# Generate manifests
npx @fsegurai/manifest-generator --route ./public/docs
```

**Dynamic Documentation Page:**
```jsx
// pages/docs/[...slug].js
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import DocumentationNav from '../../components/DocumentationNav';

export default function DocsPage({ manifest, allPaths }) {
  const router = useRouter();
  const { slug } = router.query;
  const [content, setContent] = useState('');
  
  useEffect(() => {
    if (slug) {
      const path = Array.isArray(slug) ? slug.join('/') : slug;
      // Load markdown content based on path
      fetch(`/docs/${path}.md`)
        .then(res => res.text())
        .then(setContent)
        .catch(() => setContent('# Page not found'));
    }
  }, [slug]);

  return (
    <div className="docs-layout">
      <aside className="docs-sidebar">
        <DocumentationNav manifest={manifest} />
      </aside>
      <main className="docs-content">
        <div dangerouslySetInnerHTML={{ __html: content }} />
      </main>
    </div>
  );
}

export async function getStaticProps() {
  const fs = require('fs');
  const path = require('path');
  
  const manifest = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'public/docs/manifest.json'), 'utf8')
  );
  
  return { 
    props: { manifest },
    revalidate: 60 // Regenerate every minute
  };
}

export async function getStaticPaths() {
  const fs = require('fs');
  const path = require('path');
  
  const searchIndex = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'public/docs/search-index.json'), 'utf8')
  );
  
  const paths = searchIndex.map(item => ({
    params: { slug: item.path.split('/') }
  }));
  
  return { paths, fallback: 'blocking' };
}
```

**API Route for Dynamic Generation:**
```javascript
// pages/api/docs/regenerate.js
import { generateManifest } from '@fsegurai/manifest-generator';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const docsPath = path.join(process.cwd(), 'public/docs');
    const result = generateManifest(docsPath);
    
    // Save updated files
    fs.writeFileSync(
      path.join(docsPath, 'manifest.json'),
      JSON.stringify(result.manifest, null, 2)
    );
    fs.writeFileSync(
      path.join(docsPath, 'search-index.json'),
      JSON.stringify(result.searchIndex, null, 2)
    );

    res.json({ 
      success: true, 
      manifest: result.manifest.length,
      searchIndex: result.searchIndex.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

## Vue.js Examples

### Vue 3 Composition API

**Setup:**
```bash
# Vue.js project
npm create vue@latest my-vue-docs
cd my-vue-docs

# Create docs structure
mkdir -p public/docs/guide
echo "# Welcome to Vue Docs" > public/docs/README.md
echo "# Installation Guide" > public/docs/guide/installation.md

# Generate manifests
npx @fsegurai/manifest-generator --route ./public/docs
```

**Vue Component with Composition API:**
```vue
<!-- components/DocumentationSidebar.vue -->
<template>
  <nav class="docs-sidebar">
    <div v-if="loading" class="loading">Loading documentation...</div>
    <div v-else-if="error" class="error">Error: {{ error.message }}</div>
    <ul v-else class="nav-list">
      <li v-for="item in manifest" :key="item.path || item.title">
        <router-link 
          v-if="item.path" 
          :to="`/docs/${item.path}`"
          class="nav-link"
          active-class="active"
        >
          {{ item.title }}
        </router-link>
        <span v-else class="nav-folder">{{ item.title }}</span>
        
        <ul v-if="item.children" class="nav-children">
          <li v-for="child in item.children" :key="child.path">
            <router-link 
              :to="`/docs/${child.path}`"
              class="nav-link child"
              active-class="active"
            >
              {{ child.title }}
            </router-link>
          </li>
        </ul>
      </li>
    </ul>
  </nav>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const manifest = ref([]);
const loading = ref(true);
const error = ref(null);

const loadDocumentation = async () => {
  try {
    const response = await fetch('/docs/manifest.json');
    if (!response.ok) throw new Error('Failed to load manifest');
    manifest.value = await response.json();
  } catch (err) {
    error.value = err;
  } finally {
    loading.value = false;
  }
};

onMounted(loadDocumentation);
</script>

<style scoped>
.docs-sidebar {
  width: 250px;
  padding: 1rem;
  border-right: 1px solid #e5e5e5;
}

.nav-link {
  display: block;
  padding: 0.5rem;
  text-decoration: none;
  color: #333;
  border-radius: 4px;
}

.nav-link:hover,
.nav-link.active {
  background-color: #f5f5f5;
  color: #0066cc;
}

.nav-children {
  margin-left: 1rem;
  margin-top: 0.5rem;
}
</style>
```

**Composable for Documentation:**
```javascript
// composables/useDocumentation.js
import { ref, reactive, onMounted } from 'vue';

export function useDocumentation() {
  const state = reactive({
    manifest: [],
    searchIndex: [],
    loading: true,
    error: null
  });

  const loadDocumentation = async () => {
    try {
      state.loading = true;
      state.error = null;

      const [manifestRes, searchRes] = await Promise.all([
        fetch('/docs/manifest.json'),
        fetch('/docs/search-index.json')
      ]);

      if (!manifestRes.ok || !searchRes.ok) {
        throw new Error('Failed to load documentation data');
      }

      state.manifest = await manifestRes.json();
      state.searchIndex = await searchRes.json();
    } catch (err) {
      state.error = err;
    } finally {
      state.loading = false;
    }
  };

  const searchDocs = (query) => {
    if (!query.trim()) return [];
    
    return state.searchIndex.filter(item =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );
  };

  onMounted(loadDocumentation);

  return {
    ...toRefs(state),
    loadDocumentation,
    searchDocs
  };
}
```

## Angular Examples

### Angular Service and Component

**Documentation Service:**
```typescript
// src/app/services/documentation.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

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
  private manifestSubject = new BehaviorSubject<NavigationItem[]>([]);
  private searchIndexSubject = new BehaviorSubject<SearchEntry[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(true);

  public manifest$ = this.manifestSubject.asObservable();
  public searchIndex$ = this.searchIndexSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadDocumentation();
  }

  private loadDocumentation(): void {
    combineLatest([
      this.http.get<NavigationItem[]>('/assets/docs/manifest.json'),
      this.http.get<SearchEntry[]>('/assets/docs/search-index.json')
    ]).pipe(
      map(([manifest, searchIndex]) => ({ manifest, searchIndex })),
      catchError(error => {
        console.error('Failed to load documentation:', error);
        throw error;
      })
    ).subscribe({
      next: ({ manifest, searchIndex }) => {
        this.manifestSubject.next(manifest);
        this.searchIndexSubject.next(searchIndex);
        this.loadingSubject.next(false);
      },
      error: () => {
        this.loadingSubject.next(false);
      }
    });
  }

  searchDocumentation(query: string): Observable<SearchEntry[]> {
    return this.searchIndex$.pipe(
      map(entries => {
        if (!query.trim()) return [];
        
        const lowerQuery = query.toLowerCase();
        return entries.filter(entry =>
          entry.title.toLowerCase().includes(lowerQuery) ||
          entry.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
        );
      })
    );
  }

  refreshDocumentation(): void {
    this.loadingSubject.next(true);
    this.loadDocumentation();
  }
}
```

**Navigation Component:**
```typescript
// src/app/components/documentation-nav/documentation-nav.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DocumentationService, NavigationItem } from '../../services/documentation.service';

@Component({
  selector: 'app-documentation-nav',
  templateUrl: './documentation-nav.component.html',
  styleUrls: ['./documentation-nav.component.scss']
})
export class DocumentationNavComponent implements OnInit, OnDestroy {
  manifest: NavigationItem[] = [];
  loading = true;
  private destroy$ = new Subject<void>();

  constructor(
    private docService: DocumentationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.docService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => this.loading = loading);

    this.docService.manifest$
      .pipe(takeUntil(this.destroy$))
      .subscribe(manifest => this.manifest = manifest);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  navigateToDoc(path: string): void {
    this.router.navigate(['/docs', path]);
  }

  isActiveRoute(path: string): boolean {
    return this.router.url.includes(`/docs/${path}`);
  }
}
```

**Component Template:**
```html
<!-- src/app/components/documentation-nav/documentation-nav.component.html -->
<nav class="documentation-nav">
  <div *ngIf="loading" class="loading">
    Loading documentation...
  </div>
  
  <ul *ngIf="!loading" class="nav-list">
    <li *ngFor="let item of manifest" class="nav-item">
      <a *ngIf="item.path; else folderTemplate"
         [routerLink]="['/docs', item.path]"
         routerLinkActive="active"
         class="nav-link">
        {{ item.title }}
      </a>
      
      <ng-template #folderTemplate>
        <span class="nav-folder">{{ item.title }}</span>
      </ng-template>
      
      <ul *ngIf="item.children" class="nav-children">
        <li *ngFor="let child of item.children" class="nav-child">
          <a [routerLink]="['/docs', child.path]"
             routerLinkActive="active"
             class="nav-link child">
            {{ child.title }}
          </a>
        </li>
      </ul>
    </li>
  </ul>
</nav>
```

## Gatsby Examples

### Gatsby Plugin Integration

**Plugin Setup:**
```javascript
// plugins/gatsby-plugin-manifest-generator/gatsby-node.js
const { generateManifest } = require('@fsegurai/manifest-generator');
const fs = require('fs');
const path = require('path');

exports.onPostBuild = async ({ graphql, reporter }) => {
  reporter.info('Generating documentation manifests...');
  
  try {
    const docsPath = path.join(__dirname, '../../content/docs');
    const result = generateManifest(docsPath);
    
    const publicPath = path.join(__dirname, '../../public');
    
    // Ensure directory exists
    if (!fs.existsSync(publicPath)) {
      fs.mkdirSync(publicPath, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(publicPath, 'manifest.json'),
      JSON.stringify(result.manifest, null, 2)
    );
    
    fs.writeFileSync(
      path.join(publicPath, 'search-index.json'),
      JSON.stringify(result.searchIndex, null, 2)
    );
    
    reporter.success('Documentation manifests generated successfully!');
  } catch (error) {
    reporter.error('Failed to generate documentation manifests:', error);
  }
};
```

**Gatsby Configuration:**
```javascript
// gatsby-config.js
module.exports = {
  plugins: [
    'gatsby-plugin-manifest-generator',
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        name: 'docs',
        path: `${__dirname}/content/docs/`,
      },
    },
    // ... other plugins
  ],
};
```

**React Hook for Gatsby:**
```jsx
// src/hooks/use-documentation.js
import { useState, useEffect } from 'react';

export const useDocumentation = () => {
  const [manifest, setManifest] = useState([]);
  const [searchIndex, setSearchIndex] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch('/manifest.json').then(r => r.json()),
      fetch('/search-index.json').then(r => r.json())
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
};
```

## Svelte Examples

### Svelte Store and Components

**Documentation Store:**
```javascript
// src/stores/documentation.js
import { writable, derived } from 'svelte/store';

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
      update(state => ({ ...state, loading: true, error: null }));
      
      try {
        const [manifestRes, searchRes] = await Promise.all([
          fetch('/docs/manifest.json'),
          fetch('/docs/search-index.json')
        ]);
        
        if (!manifestRes.ok || !searchRes.ok) {
          throw new Error('Failed to load documentation');
        }
        
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
    },
    search: (query) => derived(
      { subscribe },
      ($doc) => {
        if (!query.trim()) return [];
        
        const lowerQuery = query.toLowerCase();
        return $doc.searchIndex.filter(entry =>
          entry.title.toLowerCase().includes(lowerQuery) ||
          entry.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
        );
      }
    )
  };
}

export const documentation = createDocumentationStore();
```

**Svelte Navigation Component:**
```svelte
<!-- src/components/DocumentationNav.svelte -->
<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { documentation } from '../stores/documentation.js';

  let currentPath = '';

  onMount(() => {
    documentation.load();
  });

  $: currentPath = $page.url.pathname;

  function isActive(path) {
    return currentPath.includes(`/docs/${path}`);
  }
</script>

<nav class="documentation-nav">
  {#if $documentation.loading}
    <div class="loading">Loading documentation...</div>
  {:else if $documentation.error}
    <div class="error">Error: {$documentation.error}</div>
  {:else}
    <ul class="nav-list">
      {#each $documentation.manifest as item}
        <li class="nav-item">
          {#if item.path}
            <a 
              href="/docs/{item.path}" 
              class="nav-link"
              class:active={isActive(item.path)}
            >
              {item.title}
            </a>
          {:else}
            <span class="nav-folder">{item.title}</span>
          {/if}
          
          {#if item.children}
            <ul class="nav-children">
              {#each item.children as child}
                <li>
                  <a 
                    href="/docs/{child.path}" 
                    class="nav-link child"
                    class:active={isActive(child.path)}
                  >
                    {child.title}
                  </a>
                </li>
              {/each}
            </ul>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</nav>

<style>
  .documentation-nav {
    width: 250px;
    padding: 1rem;
    border-right: 1px solid #e5e5e5;
  }

  .nav-link {
    display: block;
    padding: 0.5rem;
    text-decoration: none;
    color: #333;
    border-radius: 4px;
    transition: background-color 0.2s;
  }

  .nav-link:hover,
  .nav-link.active {
    background-color: #f5f5f5;
    color: #0066cc;
  }

  .nav-children {
    margin-left: 1rem;
    margin-top: 0.5rem;
    list-style: none;
  }

  .nav-folder {
    font-weight: bold;
    color: #666;
    padding: 0.5rem;
    display: block;
  }

  .loading, .error {
    padding: 1rem;
    text-align: center;
    color: #666;
  }

  .error {
    color: #d32f2f;
  }
</style>
```

## Framework-Agnostic Examples

### Vanilla JavaScript Implementation

```javascript
// docs-manager.js
class DocumentationManager {
  constructor(manifestUrl, searchIndexUrl) {
    this.manifestUrl = manifestUrl;
    this.searchIndexUrl = searchIndexUrl;
    this.manifest = [];
    this.searchIndex = [];
    this.listeners = new Map();
  }

  async load() {
    try {
      this.emit('loading', true);
      
      const [manifestRes, searchRes] = await Promise.all([
        fetch(this.manifestUrl),
        fetch(this.searchIndexUrl)
      ]);
      
      this.manifest = await manifestRes.json();
      this.searchIndex = await searchRes.json();
      
      this.emit('loaded', {
        manifest: this.manifest,
        searchIndex: this.searchIndex
      });
      
      this.emit('loading', false);
    } catch (error) {
      this.emit('error', error);
      this.emit('loading', false);
    }
  }

  search(query) {
    if (!query.trim()) return [];
    
    const results = this.searchIndex.filter(item =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );
    
    this.emit('search-results', results);
    return results;
  }

  renderNavigation(container) {
    if (!container) return;
    
    const nav = document.createElement('nav');
    nav.className = 'documentation-nav';
    
    const list = this.createNavigationList(this.manifest);
    nav.appendChild(list);
    
    container.innerHTML = '';
    container.appendChild(nav);
  }

  createNavigationList(items) {
    const ul = document.createElement('ul');
    ul.className = 'nav-list';
    
    items.forEach(item => {
      const li = document.createElement('li');
      li.className = 'nav-item';
      
      if (item.path) {
        const a = document.createElement('a');
        a.href = `/docs/${item.path}`;
        a.textContent = item.title;
        a.className = 'nav-link';
        li.appendChild(a);
      } else {
        const span = document.createElement('span');
        span.textContent = item.title;
        span.className = 'nav-folder';
        li.appendChild(span);
      }
      
      if (item.children) {
        const childList = this.createNavigationList(item.children);
        childList.className = 'nav-children';
        li.appendChild(childList);
      }
      
      ul.appendChild(li);
    });
    
    return ul;
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }
}

// Usage
const docs = new DocumentationManager('/docs/manifest.json', '/docs/search-index.json');

docs.on('loaded', ({ manifest, searchIndex }) => {
  console.log('Documentation loaded:', manifest.length, 'items');
  docs.renderNavigation(document.getElementById('nav-container'));
});

docs.on('error', (error) => {
  console.error('Failed to load documentation:', error);
});

docs.load();
```

## Next Steps

These framework examples provide comprehensive integration patterns for the most popular frontend frameworks. Each example includes:

- **Setup instructions** for the specific framework
- **Component implementations** with proper state management
- **Service/store patterns** for data management
- **Search functionality** implementation
- **Navigation rendering** with active states

Choose the framework that matches your project and adapt the examples to your specific needs. For more detailed integration patterns, check:

- 🔗 **Build Integration**: [Build Systems](../integration/build-systems.md)
- 🔧 **API Usage**: [API Examples](../api/examples.md)
- ⚡ **Advanced Usage**: [Advanced Examples](advanced.md)
