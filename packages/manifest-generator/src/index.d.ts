/**
 * Navigation item structure for the manifest
 */
export interface NavigationItem {
  title: string;
  path?: string;
  tags?: string[];
  children?: NavigationItem[];
}

/**
 * Search entry structure for the search index
 */
export interface SearchEntry {
  title: string;
  path: string;
  tags?: string[];
}

/**
 * Result of generating a manifest
 */
export interface ManifestResult {
  manifest: NavigationItem[];
  searchIndex: SearchEntry[];
}

/**
 * Discovered project information
 */
export interface DiscoveredProject {
  name: string;
  projectPath: string;
  docsPath: string;
  type: 'subfolder' | 'direct';
}

/**
 * Processing result for each project
 */
export interface ProcessingResult {
  name: string;
  processed: boolean;
  error?: string;
}

/**
 * Options for project discovery
 */
export interface DiscoveryOptions {
  docsSubfolder?: string;
}

/**
 * Options for manifest generation with discovery
 */
export interface ManifestGenerationOptions {
  project?: string | null;
  route?: string | null;
  outputDir?: string | null;
  docsSubfolder?: string;
  autoDetect?: boolean;
}

/**
 * Format a filename or directory name into a readable title
 */
export function formatTitle(name: string): string;

/**
 * Parse frontmatter from Markdown content
 */
export function parseFrontmatter<T = Record<string, unknown>>(content: string): T;

/**
 * Walk through docs directory and build navigation structure
 */
export function walkDocs(dir: string, relative?: string, searchIndex?: SearchEntry[]): NavigationItem[];

/**
 * Generate documentation manifests for all projects
 */
export function generateDocsManifests(docsRoot: string): void;

/**
 * Generate manifest for a single project
 */
export function generateManifest(projectPath: string): ManifestResult;

/**
 * Auto-discover documentation projects in a directory
 */
export function discoverProjects(rootDir: string, options?: DiscoveryOptions): DiscoveredProject[];

/**
 * Generate manifests with automatic discovery and flexible options
 */
export function generateManifestsWithDiscovery(rootDir: string, options?: ManifestGenerationOptions): ProcessingResult[];
