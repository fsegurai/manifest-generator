/**
 * Types-only entry (`@fsegurai/manifest-generator/schema`) describing the generated files, with no
 * runtime code and no `node:*` imports. JSON Schemas for the same shapes ship as
 * `@fsegurai/manifest-generator/schema/manifest.schema.json` and `.../search-index.schema.json`.
 */
export type {
  BreadcrumbSegment,
  Frontmatter,
  FrontmatterAliases,
  ManifestResult,
  NavigationItem,
  PageLink,
  PageSection,
  SearchEntry,
  ValidateResult,
} from './types.js';
