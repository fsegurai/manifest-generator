---
label: Types and JSON Schema
description: Type and validate manifest.json and search-index.json with @fsegurai/manifest-generator/schema and the shipped JSON Schemas.
tags: [ "api", "schema", "typescript", "json-schema" ]
keywords: [ "NavigationItem", "SearchEntry", "PageLink", "manifest.schema.json", "search-index.schema.json" ]
---

# Types and JSON Schema

Since `1.2.0`, apps that only **read** the generated files do not need the generator's runtime code: they can import
the types from a types-only entry and check the files against shipped JSON Schemas.

## Types-only entry: `@fsegurai/manifest-generator/schema`

```ts
import type { NavigationItem, SearchEntry } from '@fsegurai/manifest-generator/schema';

const manifest: NavigationItem[] = await (await fetch('/docs/manifest.json')).json();
const searchIndex: SearchEntry[] = await (await fetch('/docs/search-index.json')).json();
```

Exported types: `NavigationItem`, `SearchEntry`, `BreadcrumbSegment`, `PageLink`, `PageSection`, `Frontmatter`,
`FrontmatterAliases`, `ManifestResult`, and `ValidateResult`. The entry has no runtime code and no `node:*` imports, so it is safe in any
frontend bundle. The same types are also exported from the package root.

`PageLink` (`{ label: string; route: string }`) is the shape of the `prev` / `next` fields that the `prevNext` option
writes on page items — see [Previous / next links](../guides/configuration.md#prevnext--previous--next-links).

## JSON Schemas

Two draft-07 JSON Schemas ship in the package's `schema/` folder:

| File                       | Package path                                                      | Describes                    |
|----------------------------|---------------------------------------------------------------------|------------------------------|
| `manifest.schema.json`     | `@fsegurai/manifest-generator/schema/manifest.schema.json`         | `manifest.json` (array of `NavigationItem`) |
| `search-index.schema.json` | `@fsegurai/manifest-generator/schema/search-index.schema.json`     | `search-index.json` (array of `SearchEntry`) |

They reject unknown properties, so a consumer that validates in CI also catches format drift between generator
versions.

### Validate in CI with Ajv

```ts
import Ajv from 'ajv';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ajv = new Ajv({ allErrors: true });

const checks = [
  ['@fsegurai/manifest-generator/schema/manifest.schema.json', './docs/manifest.json'],
  ['@fsegurai/manifest-generator/schema/search-index.schema.json', './docs/search-index.json'],
] as const;

for (const [schemaPath, filePath] of checks) {
  const validate = ajv.compile(require(schemaPath));
  if (!validate(JSON.parse(readFileSync(filePath, 'utf8')))) {
    console.error(filePath, validate.errors);
    process.exitCode = 1;
  }
}
```

### Editor support

Point a JSON file at the schema to get completion and validation in editors that support `$schema` mappings, for
example in VS Code `settings.json`:

```json
{
  "json.schemas": [
    { "fileMatch": ["**/manifest.json"], "url": "./node_modules/@fsegurai/manifest-generator/schema/manifest.schema.json" },
    { "fileMatch": ["**/search-index.json"], "url": "./node_modules/@fsegurai/manifest-generator/schema/search-index.schema.json" }
  ]
}
```

## Next step

- [TypeScript](typescript.md) — every exported interface and its fields
- [Browser-safe Core](core.md) — build the files in the browser
