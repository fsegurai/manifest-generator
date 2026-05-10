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
  children?: NavigationItem[];
}

export interface SearchEntry {
  label: string;
  description?: string;
  route: string;
  tags?: string[];
}

export interface ManifestResult {
  manifest: NavigationItem[];
  searchIndex: SearchEntry[];
}

export interface DiscoveredProject {
  name: string;
  projectPath: string;
  docsPath: string;
  type: 'subfolder' | 'direct';
}

export interface ProcessingResult {
  name: string;
  processed: boolean;
  error?: string;
}

export interface DiscoveryOptions {
  docsSubfolder?: string;
}

export interface ManifestGenerationOptions {
  project?: string | null;
  route?: string | null;
  outputDir?: string | null;
  docsSubfolder?: string;
  autoDetect?: boolean;
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
}

