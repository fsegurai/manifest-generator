/**
 * Navigation item structure for the manifest
 */
export interface NavigationItem {
  label: string;
  route?: string;
  tags?: string[];
  isParent?: boolean;          // New field to indicate if this is a parent item
  description?: string;        // Optional description field for more context
  icon?: string | null;        // Optional icon for visual representation
  iconType?: string | null;    // Optional icon type could be 'font' or 'image'
  badge?: string | null;       // Optional badge for extra info, like "New"
  badgeColor?: string | null;  // Optional color for the badge
  children?: NavigationItem[]; // Sub-items if it's a parent
}

/**
 * Search entry structure for the search index
 */
export interface SearchEntry {
  label: string;               // Changed from 'title' to 'label'
  description?: string;
  route: string;
  tags?: string[];
}

/**
 * Result of generating a manifest
 */
export interface ManifestResult {
  manifest: NavigationItem[];  // Array of navigation items
  searchIndex: SearchEntry[];  // Array of search index entries
}

/**
 * Discovered project information
 */
export interface DiscoveredProject {
  name: string;                // Name of the project
  projectPath: string;         // Absolute path of the project
  docsPath: string;            // Absolute path to the docs folder
  type: 'subfolder' | 'direct'; // Whether it's a 'subfolder' or 'direct' docs
}

/**
 * Processing result for each project
 */
export interface ProcessingResult {
  name: string;                // Name of the project
  processed: boolean;          // Whether the project was processed successfully
  error?: string;              // Optional error message if processing failed
}

/**
 * Options for project discovery
 */
export interface DiscoveryOptions {
  docsSubfolder?: string;      // The name of the docs folder (default: 'docs')
}

/**
 * Options for manifest generation with discovery
 */
export interface ManifestGenerationOptions {
  project?: string | null;     // The specific project to generate the manifest for (optional)
  route?: string | null;       // A specific route to process (optional)
  outputDir?: string | null;   // Directory where the manifest should be saved (optional)
  docsSubfolder?: string;      // The docs subfolder name (default: 'docs')
  autoDetect?: boolean;        // Whether to automatically detect projects (default: true)
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
