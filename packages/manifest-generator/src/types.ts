export interface NavigationItem {
  label: string;
  route?: string;
  tags?: string[];
  isTitle?: boolean;
  isParent?: boolean;
  description?: string;
  icon?: string | null;
  iconType?: string | null;
  badge?: string | null;
  badgeColor?: string | null;
  order?: number;
  redirect?: string;
  externalUrl?: string;
  breadcrumbTitle?: string;
  layout?: string;
  deprecated?: boolean;
  deprecatedAlternative?: string;
  publishedAt?: string;
  updatedAt?: string;
  keywords?: string[];
  children?: NavigationItem[];
}

export interface SearchEntry {
  label: string;
  description?: string;
  route: string;
  tags?: string[];
  headings?: string[];
  excerpt?: string;
  breadcrumb?: string;
}

export interface ManifestResult {
  manifest: NavigationItem[];
  searchIndex: SearchEntry[];
}

export interface DiscoveredProject {
  name: string;
  projectPath: string;
  docsPath: string;
  type: 'subfolder' | 'direct' | 'recursive';
}

export interface ProcessingResult {
  name: string;
  processed: boolean;
  error?: string;
}

export interface DiscoveryOptions {
  docsSubfolder?: string;
  recursive?: boolean;
  exclude?: string[];
}

export interface ManifestGenerationOptions {
  project?: string | null;
  route?: string | null;
  outputDir?: string | null;
  docsSubfolder?: string;
  autoDetect?: boolean;
  recursive?: boolean;
  exclude?: string[];
  projects?: Record<string, ProjectConfig>;
  dryRun?: boolean;
}

export interface Frontmatter {
  label?: string;
  description?: string;
  tags?: string[];
  isTitle?: boolean;
  isParent?: boolean;
  icon?: string | null;
  iconType?: string | null;
  badge?: string | null;
  badgeColor?: string | null;
  draft?: boolean;
  hidden?: boolean;
  order?: number;
  redirect?: string;
  externalUrl?: string;
  breadcrumbTitle?: string;
  layout?: string;
  deprecated?: boolean;
  deprecatedAlternative?: string;
  publishedAt?: string;
  updatedAt?: string;
  keywords?: string[];
}

export interface ProjectConfig {
  docsSubfolder?: string;
  outputDir?: string;
}

export interface ConfigFile {
  docsRoot?: string;
  docsSubfolder?: string;
  outputDir?: string;
  recursive?: boolean;
  exclude?: string[];
  projects?: Record<string, ProjectConfig>;
}

export interface ValidateResult {
  file: string;
  valid: boolean;
  warnings: string[];
  errors: string[];
  frontmatter?: Frontmatter;
}
