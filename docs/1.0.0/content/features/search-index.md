# Search Index

The Manifest Generator creates comprehensive search indexes alongside navigation manifests, enabling powerful search
functionality for your documentation.

## What is a Search Index?

A search index is a flat, structured data file that contains all searchable content from your documentation. Unlike the
hierarchical manifest, the search index provides a linear list of all documents with their metadata.

## Generated Structure

### Basic Search Entry

```json
{
    "label": "Getting Started Guide",
    "route": "getting-started/getting-started-guide",
    "tags": [
        "guide",
        "beginner"
    ],
    "headings": [
        "Installation",
        "Quick Start",
        "Configuration"
    ],
    "excerpt": "A step-by-step guide to get your project up and running with the Manifest Generator.",
    "breadcrumb": "Getting Started"
}
```

When the output directory differs from the content source directory, routes are automatically prefixed with the
relative path from output to source. For example, with `--output ./docs/v1 --route ./docs/v1/content`, routes become
`content/getting-started/guide`.

### Complete Search Index Example

```json
[
    {
        "label": "README",
        "route": "content/README"
    },
    {
        "label": "Installation",
        "route": "content/getting-started/installation",
        "tags": [
            "setup",
            "install"
        ],
        "headings": [
            "Requirements",
            "Verify installation",
            "Next step"
        ],
        "excerpt": "Use one of these paths depending on how you want to run the generator.",
        "breadcrumb": "Getting Started"
    },
    {
        "label": "API Reference",
        "route": "content/api/reference",
        "tags": [
            "api",
            "reference"
        ],
        "headings": [
            "Imports",
            "generateManifest",
            "watchDocs"
        ],
        "excerpt": "The package exports its programmatic API from the package root.",
        "breadcrumb": "Api"
    },
    {
        "label": "Configuration",
        "route": "content/guides/configuration",
        "tags": [
            "configuration",
            "advanced"
        ],
        "excerpt": "Configuration is driven by CLI flags, a config file, or the programmatic API.",
        "breadcrumb": "Guides"
    }
]
```

Note that top-level pages like `README` (route with a single segment, no `/`) have **no `breadcrumb` key at all** —
`makeBreadcrumb()` returns `undefined` for single-segment routes, and `JSON.stringify` simply omits `undefined`
values. This is different from `cleanItem()`, which strips empty fields from `manifest.json`; search-index entries
aren't run through `cleanItem()`, but in practice their optional fields (`tags`, `headings`, `excerpt`, `breadcrumb`)
are only ever set to a real value or left `undefined` — never an empty string.

### Search Index Fields

Each entry in the search index contains these fields:

| Field        | Type     | Description                                                    |
|--------------|----------|------------------------------------------------------------------|
| `label`      | string   | Document title used in navigation                              |
| `route`      | string   | Relative path (no leading `/`)                                 |
| `tags`       | string[] | Search tags from frontmatter                                   |
| `headings`   | string[] | Deduplicated `h2`/`h3` headings extracted from the body        |
| `excerpt`    | string   | First ~150 characters of body content, stripped of markup      |
| `breadcrumb` | string   | Auto-generated breadcrumb context from the route path segments (omitted for single-segment routes) |

`headings` are deduplicated using Dice coefficient (bigram similarity, threshold 0.7) so near-identical headings like
"Installation" and "Installation Guide" collapse into one entry. This keeps the index lean without losing meaningful
nav points.

`excerpt` is truncated at word or sentence boundaries to avoid mid-word cuts. It does **not** include the full document
body — the search index stays small enough to ship to browsers.

`breadcrumb` is derived from the route path: `getting-started/installation` → `"Getting Started"`.

## Search Index vs Manifest

### Manifest (Hierarchical)

```json
[
    {
        "label": "Getting Started",
        "route": "getting-started",
        "tags": [
            "guide"
        ]
    },
    {
        "label": "API",
        "isParent": true,
        "children": [
            {
                "label": "Reference",
                "route": "api/reference",
                "tags": [
                    "api"
                ]
            }
        ]
    }
]
```

### Search Index (Flat)

```json
[
    {
        "label": "Getting Started",
        "route": "getting-started",
        "tags": [
            "guide"
        ]
    },
    {
        "label": "Reference",
        "route": "api/reference",
        "tags": [
            "api"
        ]
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
            entry.label.toLowerCase().includes(lowercaseQuery) ||
            (entry.tags || []).some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
            (entry.excerpt && entry.excerpt.toLowerCase().includes(lowercaseQuery))
    );
}

// Usage
const searchIndex = await loadSearchIndex();
const results = searchDocs('api', searchIndex);
console.log(results);
```

#### React Implementation

```jsx
import {useState, useEffect} from 'react';

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
                entry.label.toLowerCase().includes(query.toLowerCase()) ||
                (entry.tags || []).some(tag =>
                        tag.toLowerCase().includes(query.toLowerCase())
                ) ||
                (entry.excerpt && entry.excerpt.toLowerCase().includes(query.toLowerCase()))
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
                            <div key={result.route}>
                                <a href={`/docs/${result.route}`}>
                                    {result.label}
                                </a>
                                <div>
                                    {(result.tags || []).map(tag => (
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

## Tag-Based Filtering

### Filter by Single Tag

```javascript
function filterByTag(tag, searchIndex) {
    return searchIndex.filter(entry =>
            (entry.tags || []).includes(tag)
    );
}

// Usage
const apiDocs = filterByTag('api', searchIndex);
const guides = filterByTag('guide', searchIndex);
```

### Filter by Multiple Tags

```javascript
function filterByTags(tags, searchIndex, matchAll = false) {
    return searchIndex.filter(entry => {
        const entryTags = entry.tags || [];
        if (matchAll) {
            // Must have ALL specified tags
            return tags.every(tag => entryTags.includes(tag));
        } else {
            // Must have at least ONE specified tag
            return tags.some(tag => entryTags.includes(tag));
        }
    });
}

// Usage
const advancedApiDocs = filterByTags(['api', 'advanced'], searchIndex, true);
const guideOrTutorial = filterByTags(['guide', 'tutorial'], searchIndex, false);
```

### Get All Available Tags

```javascript
function getAllTags(searchIndex) {
    const allTags = searchIndex.flatMap(entry => entry.tags || []);
    return [...new Set(allTags)].sort();
}

// Usage
const availableTags = getAllTags(searchIndex);
console.log('Available tags:', availableTags);
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
9. **Optional fields**: always guard `tags`/`headings`/`excerpt`/`breadcrumb` with a fallback (`|| []` / `?.`) — they
   may be entirely absent on a given entry.
