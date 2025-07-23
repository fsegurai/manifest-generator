# Search Index

The Manifest Generator creates comprehensive search indexes alongside navigation manifests, enabling powerful search functionality for your documentation.

## What is a Search Index?

A search index is a flat, structured data file that contains all searchable content from your documentation. Unlike the hierarchical manifest, the search index provides a linear list of all documents with their metadata.

## Generated Structure

### Basic Search Entry
```json
{
  "title": "Getting Started Guide",
  "path": "getting-started",
  "tags": ["guide", "beginner"]
}
```

### Complete Search Index Example
```json
[
  {
    "title": "README",
    "path": "README",
    "tags": []
  },
  {
    "title": "Getting Started Guide",
    "path": "getting-started", 
    "tags": ["guide", "beginner"]
  },
  {
    "title": "API Reference",
    "path": "api/reference",
    "tags": ["api", "reference"]
  },
  {
    "title": "Configuration Options",
    "path": "config/options",
    "tags": ["configuration", "advanced"]
  }
]
```

## Search Index vs Manifest

### Manifest (Hierarchical)
```json
[
  {
    "title": "Getting Started",
    "path": "getting-started",
    "tags": ["guide"]
  },
  {
    "title": "API",
    "children": [
      {
        "title": "Reference",
        "path": "api/reference", 
        "tags": ["api"]
      }
    ]
  }
]
```

### Search Index (Flat)
```json
[
  {
    "title": "Getting Started",
    "path": "getting-started",
    "tags": ["guide"]
  },
  {
    "title": "Reference", 
    "path": "api/reference",
    "tags": ["api"]
  }
]
```

**Key Differences:**
- **Manifest**: Preserves folder hierarchy with nested children
- **Search Index**: Flattens all content into a searchable list
- **Navigation**: Use manifest for menus, search index for search functionality

## Implementation Examples

### Basic Search Implementation

#### Vanilla JavaScript
```javascript
// Load search index
async function loadSearchIndex() {
  const response = await fetch('/search-index.json');
  return await response.json();
}

// Simple search function
function searchDocs(query, searchIndex) {
  const lowercaseQuery = query.toLowerCase();
  
  return searchIndex.filter(entry => 
    entry.title.toLowerCase().includes(lowercaseQuery) ||
    entry.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  );
}

// Usage
const searchIndex = await loadSearchIndex();
const results = searchDocs('api', searchIndex);
console.log(results);
```

#### React Implementation
```jsx
import { useState, useEffect } from 'react';

function DocumentationSearch() {
  const [searchIndex, setSearchIndex] = useState([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  // Load search index
  useEffect(() => {
    fetch('/search-index.json')
      .then(res => res.json())
      .then(setSearchIndex);
  }, []);

  // Perform search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const filtered = searchIndex.filter(entry =>
      entry.title.toLowerCase().includes(query.toLowerCase()) ||
      entry.tags.some(tag => 
        tag.toLowerCase().includes(query.toLowerCase())
      )
    );

    setResults(filtered);
  }, [query, searchIndex]);

  return (
    <div>
      <input
        type="text"
        placeholder="Search documentation..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      
      <div>
        {results.map(result => (
          <div key={result.path}>
            <a href={`/docs/${result.path}`}>
              {result.title}
            </a>
            <div>
              {result.tags.map(tag => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### Vue.js Implementation
```vue
<template>
  <div>
    <input
      v-model="query"
      type="text"
      placeholder="Search documentation..."
    />
    
    <div v-for="result in results" :key="result.path">
      <router-link :to="`/docs/${result.path}`">
        {{ result.title }}
      </router-link>
      <div>
        <span 
          v-for="tag in result.tags" 
          :key="tag" 
          class="tag"
        >
          {{ tag }}
        </span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      searchIndex: [],
      query: '',
    };
  },
  
  computed: {
    results() {
      if (!this.query.trim()) return [];
      
      const lowercaseQuery = this.query.toLowerCase();
      return this.searchIndex.filter(entry =>
        entry.title.toLowerCase().includes(lowercaseQuery) ||
        entry.tags.some(tag => 
          tag.toLowerCase().includes(lowercaseQuery)
        )
      );
    }
  },
  
  async mounted() {
    const response = await fetch('/search-index.json');
    this.searchIndex = await response.json();
  }
};
</script>
```

### Advanced Search Features

#### Fuzzy Search with Fuse.js
```javascript
import Fuse from 'fuse.js';

class AdvancedDocumentationSearch {
  constructor(searchIndex) {
    this.fuse = new Fuse(searchIndex, {
      keys: ['title', 'tags'],
      threshold: 0.3, // Adjust for fuzziness
      includeScore: true
    });
  }
  
  search(query) {
    if (!query.trim()) return [];
    
    return this.fuse.search(query).map(result => ({
      ...result.item,
      score: result.score
    }));
  }
  
  searchByTag(tag) {
    return this.fuse.search(`=${tag}`);
  }
}

// Usage
const searchIndex = await fetch('/search-index.json').then(r => r.json());
const search = new AdvancedDocumentationSearch(searchIndex);

const results = search.search('getting started');
const apiDocs = search.searchByTag('api');
```

#### Multi-field Search
```javascript
function advancedSearch(query, searchIndex, options = {}) {
  const {
    searchTitles = true,
    searchTags = true,
    exactMatch = false,
    caseSensitive = false
  } = options;
  
  const searchTerm = caseSensitive ? query : query.toLowerCase();
  
  return searchIndex.filter(entry => {
    const title = caseSensitive ? entry.title : entry.title.toLowerCase();
    const tags = entry.tags.map(tag => 
      caseSensitive ? tag : tag.toLowerCase()
    );
    
    const matchesTitle = searchTitles && (
      exactMatch ? title === searchTerm : title.includes(searchTerm)
    );
    
    const matchesTags = searchTags && tags.some(tag =>
      exactMatch ? tag === searchTerm : tag.includes(searchTerm)
    );
    
    return matchesTitle || matchesTags;
  });
}

// Usage examples
const exactResults = advancedSearch('API', searchIndex, { exactMatch: true });
const titleOnly = advancedSearch('guide', searchIndex, { searchTags: false });
const caseSenesitive = advancedSearch('API', searchIndex, { caseSensitive: true });
```

### Tag-Based Filtering

#### Filter by Single Tag
```javascript
function filterByTag(tag, searchIndex) {
  return searchIndex.filter(entry => 
    entry.tags.includes(tag)
  );
}

// Usage
const apiDocs = filterByTag('api', searchIndex);
const guides = filterByTag('guide', searchIndex);
```

#### Filter by Multiple Tags
```javascript
function filterByTags(tags, searchIndex, matchAll = false) {
  return searchIndex.filter(entry => {
    if (matchAll) {
      // Must have ALL specified tags
      return tags.every(tag => entry.tags.includes(tag));
    } else {
      // Must have at least ONE specified tag
      return tags.some(tag => entry.tags.includes(tag));
    }
  });
}

// Usage
const advancedApiDocs = filterByTags(['api', 'advanced'], searchIndex, true);
const guideOrTutorial = filterByTags(['guide', 'tutorial'], searchIndex, false);
```

#### Get All Available Tags
```javascript
function getAllTags(searchIndex) {
  const allTags = searchIndex.flatMap(entry => entry.tags);
  return [...new Set(allTags)].sort();
}

// Usage
const availableTags = getAllTags(searchIndex);
console.log('Available tags:', availableTags);
```

## Integration Patterns

### Static Site Generators

#### Next.js Integration
```javascript
// pages/api/search.js
import searchIndex from '../../public/search-index.json';

export default function handler(req, res) {
  const { q } = req.query;
  
  if (!q) {
    return res.json([]);
  }
  
  const results = searchIndex.filter(entry =>
    entry.title.toLowerCase().includes(q.toLowerCase()) ||
    entry.tags.some(tag => tag.toLowerCase().includes(q.toLowerCase()))
  );
  
  res.json(results);
}

// Component usage
const [results, setResults] = useState([]);

const search = async (query) => {
  const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
  const data = await response.json();
  setResults(data);
};
```

#### Gatsby Integration
```javascript
// gatsby-node.js
exports.onPostBuild = ({ graphql }) => {
  // Search index is already generated by manifest-generator
  // Gatsby can use it directly from static folder
};

// Component
import { navigate } from 'gatsby';

const SearchComponent = () => {
  const [searchIndex, setSearchIndex] = useState([]);
  
  useEffect(() => {
    // Load search index from static folder
    fetch('/search-index.json')
      .then(res => res.json())
      .then(setSearchIndex);
  }, []);
  
  const handleResultClick = (path) => {
    navigate(`/docs/${path}`);
  };
  
  // Rest of component...
};
```

### Documentation Platforms

#### Docusaurus Plugin
```javascript
// plugins/search-plugin.js
module.exports = function(context, options) {
  return {
    name: 'manifest-search-plugin',
    
    async loadContent() {
      const fs = require('fs');
      const searchIndex = JSON.parse(
        fs.readFileSync('./static/search-index.json', 'utf8')
      );
      return searchIndex;
    },
    
    async contentLoaded({ content, actions }) {
      const { setGlobalData } = actions;
      setGlobalData({ searchIndex: content });
    }
  };
};
```

#### VitePress Integration
```javascript
// .vitepress/theme/composables/useSearch.js
import { ref, computed } from 'vue';

export function useSearch() {
  const searchIndex = ref([]);
  const query = ref('');
  
  const results = computed(() => {
    if (!query.value.trim()) return [];
    
    return searchIndex.value.filter(entry =>
      entry.title.toLowerCase().includes(query.value.toLowerCase()) ||
      entry.tags.some(tag => 
        tag.toLowerCase().includes(query.value.toLowerCase())
      )
    );
  });
  
  const loadSearchIndex = async () => {
    const response = await fetch('/search-index.json');
    searchIndex.value = await response.json();
  };
  
  return {
    query,
    results,
    loadSearchIndex
  };
}
```

## Performance Optimization

### Lazy Loading
```javascript
class LazySearchIndex {
  constructor() {
    this.searchIndex = null;
    this.loading = false;
  }
  
  async ensureLoaded() {
    if (this.searchIndex) return this.searchIndex;
    if (this.loading) return new Promise(resolve => {
      const check = () => {
        if (this.searchIndex) resolve(this.searchIndex);
        else setTimeout(check, 100);
      };
      check();
    });
    
    this.loading = true;
    const response = await fetch('/search-index.json');
    this.searchIndex = await response.json();
    this.loading = false;
    
    return this.searchIndex;
  }
  
  async search(query) {
    const index = await this.ensureLoaded();
    return index.filter(entry =>
      entry.title.toLowerCase().includes(query.toLowerCase())
    );
  }
}
```

### Debounced Search
```javascript
function useDebounceSearch(searchIndex, delay = 300) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    
    setIsSearching(true);
    const timeoutId = setTimeout(() => {
      const filtered = searchIndex.filter(entry =>
        entry.title.toLowerCase().includes(query.toLowerCase()) ||
        entry.tags.some(tag => 
          tag.toLowerCase().includes(query.toLowerCase())
        )
      );
      setResults(filtered);
      setIsSearching(false);
    }, delay);
    
    return () => clearTimeout(timeoutId);
  }, [query, searchIndex, delay]);
  
  return { query, setQuery, results, isSearching };
}
```

### Indexed Search
```javascript
class IndexedSearch {
  constructor(searchIndex) {
    this.buildIndices(searchIndex);
  }
  
  buildIndices(searchIndex) {
    this.titleIndex = new Map();
    this.tagIndex = new Map();
    
    searchIndex.forEach((entry, index) => {
      // Index by title words
      entry.title.toLowerCase().split(/\s+/).forEach(word => {
        if (!this.titleIndex.has(word)) {
          this.titleIndex.set(word, []);
        }
        this.titleIndex.get(word).push(index);
      });
      
      // Index by tags
      entry.tags.forEach(tag => {
        if (!this.tagIndex.has(tag)) {
          this.tagIndex.set(tag, []);
        }
        this.tagIndex.get(tag).push(index);
      });
    });
    
    this.searchIndex = searchIndex;
  }
  
  search(query) {
    const words = query.toLowerCase().split(/\s+/);
    const matchingIndices = new Set();
    
    words.forEach(word => {
      // Find in titles
      for (const [indexedWord, indices] of this.titleIndex) {
        if (indexedWord.includes(word)) {
          indices.forEach(i => matchingIndices.add(i));
        }
      }
      
      // Find in tags
      for (const [tag, indices] of this.tagIndex) {
        if (tag.includes(word)) {
          indices.forEach(i => matchingIndices.add(i));
        }
      }
    });
    
    return Array.from(matchingIndices).map(i => this.searchIndex[i]);
  }
}
```

## Best Practices

1. **Debounce Search**: Avoid searching on every keystroke
2. **Lazy Loading**: Load search index only when needed
3. **Progressive Enhancement**: Provide fallback for JavaScript-disabled users
4. **Keyboard Navigation**: Support arrow keys and Enter for accessibility
5. **Clear Results**: Allow users to clear search results easily
6. **Search Highlighting**: Highlight matching terms in results
7. **Performance**: Consider indexing for large documentation sets
8. **Mobile Friendly**: Ensure search works well on mobile devices
