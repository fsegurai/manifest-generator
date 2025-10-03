# Frontmatter Support

The Manifest Generator provides comprehensive support for YAML frontmatter in Markdown files, allowing you to add metadata and control how your documentation is processed.

## What is Frontmatter?

Frontmatter is YAML metadata placed at the beginning of Markdown files, enclosed by `---` delimiters:

```markdown
---
label: Custom Page Title
tags: [guide, beginner]
draft: false
---

# Your Markdown Content

Regular markdown content goes here...
```

## Supported Fields

### `title`
**Type:** `string`  
**Purpose:** Override the automatically generated title

```yaml
---
label: "Advanced API Integration Guide"
---
```

**Without frontmatter:** Filename `advanced-api-guide.md` becomes "Advanced Api Guide"  
**With frontmatter:** Displays as "Advanced API Integration Guide"

### `tags`
**Type:** `string[]`  
**Purpose:** Add categorization and search metadata

```yaml
---
tags: [api, reference, advanced]
---
```

**Usage in output:**
- Included in search index for filtering
- Available for categorization in your application
- Helps with content organization

### `draft`
**Type:** `boolean`  
**Default:** `false`  
**Purpose:** Mark content as draft (excluded from output)

```yaml
---
draft: true
---
```

**Behavior:**
- Files with `draft: true` are completely excluded from manifests
- Useful for work-in-progress content
- Allows you to keep incomplete docs in your repository

### `hidden`
**Type:** `boolean`  
**Default:** `false`  
**Purpose:** Hide content from navigation (excluded from output)

```yaml
---
hidden: true
---
```

**Behavior:**
- Similar to `draft` but semantically different
- Use for internal documentation or deprecated content
- Content is excluded from both manifest and search index

## Parsing Rules

### Data Type Detection

The parser automatically detects and converts data types:

#### Strings
```yaml
---
label: Simple string
description: "Quoted string"
author: 'Single quoted'
---
```

#### Arrays
```yaml
---
tags: [guide, beginner, tutorial]
categories: ["development", "documentation"]
---
```

#### Booleans
```yaml
---
draft: true
published: false
featured: true
---
```

#### Numbers
```yaml
---
priority: 1
version: 2.5
weight: 100
---
```

### Error Handling

Invalid frontmatter is gracefully handled:

```yaml
---
# Invalid YAML - will be ignored
invalid: [unclosed array
malformed: {incomplete object
---
```

**Behavior:**
- Invalid frontmatter is ignored
- File is still processed with default values
- No errors are thrown

## Common Patterns

### Basic Page Metadata
```yaml
---
label: Getting Started Guide
tags: [guide, beginner]
---
```

### API Documentation
```yaml
---
label: User Authentication API
tags: [api, authentication, reference]
---
```

### Tutorial Content
```yaml
---
label: Building Your First App
tags: [tutorial, beginner, quickstart]
---
```

### Reference Documentation
```yaml
---
label: Configuration Reference
tags: [reference, configuration, advanced]
---
```

### Work in Progress
```yaml
---
label: Advanced Features (Draft)
draft: true
tags: [advanced, incomplete]
---
```

### Internal Documentation
```yaml
---
label: Internal Development Notes
hidden: true
tags: [internal, development]
---
```

## Advanced Usage

### Conditional Frontmatter

You can use environment-based conditions in your build process:

```yaml
---
title: Development Guide
draft: ${NODE_ENV !== 'production'}
tags: [development]
---
```

### Complex Tag Structures
```yaml
---
title: Comprehensive API Guide
tags: 
  - api
  - reference
  - authentication
  - endpoints
  - examples
---
```

### Multi-line Content
```yaml
---
title: Complex Configuration Guide
description: |
  This is a multi-line description
  that spans several lines and provides
  detailed information about the content.
tags: [configuration, advanced]
---
```

## Integration Examples

### Static Site Generators

#### Jekyll/GitHub Pages
```yaml
---
layout: default
title: Custom Page Title
permalink: /custom-url/
tags: [guide]
---
```

#### Hugo
```yaml
---
title: Page Title
date: 2025-01-15
weight: 10
tags: [guide, tutorial]
---
```

#### Gatsby
```yaml
---
title: Page Title
path: "/custom-path"
tags: [guide]
templateKey: "guide-template"
---
```

### Documentation Platforms

#### Docusaurus
```yaml
---
id: getting-started
title: Getting Started
sidebar_label: Quick Start
tags: [guide, beginner]
---
```

#### VitePress
```yaml
---
title: Getting Started
editLink: true
tags: [guide]
prev: ./introduction
next: ./installation
---
```

#### GitBook
```yaml
---
title: Getting Started
description: Quick start guide
tags: [guide, beginner]
---
```

## Processing Behavior

### Manifest Generation

Frontmatter affects manifest structure:

```markdown
<!-- File: api/authentication.md -->
---
title: User Authentication
tags: [api, auth]
---
```

**Generates:**
```json
{
  "title": "User Authentication",
  "path": "api/authentication",
  "tags": ["api", "auth"]
}
```

### Search Index

All frontmatter metadata is included in search indexes:

```json
{
  "title": "User Authentication",
  "path": "api/authentication", 
  "tags": ["api", "auth"]
}
```

### Hierarchical Structure

Frontmatter titles are used in navigation hierarchies:

```
api/
├── authentication.md (title: "User Authentication")
└── endpoints.md (title: "API Endpoints")
```

**Results in:**
```json
{
  "title": "Api",
  "children": [
    {
      "title": "User Authentication",
      "path": "api/authentication",
      "tags": ["api", "auth"]
    },
    {
      "title": "API Endpoints", 
      "path": "api/endpoints",
      "tags": ["api", "reference"]
    }
  ]
}
```

## Validation and Best Practices

### Valid YAML Syntax
```yaml
---
# Good: proper array syntax
tags: [guide, beginner]

# Good: quoted strings with special characters
title: "API: Getting Started"

# Good: boolean values
draft: false
---
```

### Invalid Syntax to Avoid
```yaml
---
# Bad: unclosed array
tags: [guide, beginner

# Bad: unquoted string with colons
title: API: Getting Started

# Bad: invalid boolean
draft: yes
---
```

### Recommended Patterns

#### Consistent Tag Naming
```yaml
# Use consistent, lowercase tags
tags: [api, guide, beginner]

# Not: mixed case and inconsistent naming
tags: [API, Guide, beginner-tutorial]
```

#### Descriptive Titles
```yaml
# Good: clear and descriptive
title: "REST API Authentication Guide"

# Not: too generic
title: "Guide"
```

#### Logical Organization
```yaml
# Group related tags
tags: [api, authentication, security, guide]

# Separate by purpose
tags: [tutorial, beginner, quickstart]
```

## Troubleshooting

### Frontmatter Not Parsing

**Check syntax:**
```yaml
---
# Ensure proper YAML syntax
title: "Valid Title"
tags: [valid, array]
---
```

**Verify delimiters:**
```markdown
---  ← Must be exactly three dashes
title: Page Title
---  ← Must be exactly three dashes

# Content starts here
```

### Missing Content

**Check for draft/hidden flags:**
```yaml
---
title: Missing Page
draft: true  ← Remove this
hidden: false
---
```

### Incorrect Data Types

**Verify array syntax:**
```yaml
# Correct
tags: [guide, tutorial]

# Also correct
tags:
  - guide
  - tutorial

# Incorrect
tags: guide, tutorial
```

## Migration Guides

### From Jekyll
```yaml
# Jekyll frontmatter
---
layout: post
title: Page Title
categories: [guide]
---

# Manifest Generator equivalent
---
title: Page Title
tags: [guide]
---
```

### From Hugo
```yaml
# Hugo frontmatter
---
title: Page Title
weight: 10
categories: [guide]
---

# Manifest Generator equivalent
---
title: Page Title
tags: [guide]
---
```

The Manifest Generator focuses on the essential metadata (`title`, `tags`, `draft`, `hidden`) while ignoring platform-specific fields, making migration straightforward.
