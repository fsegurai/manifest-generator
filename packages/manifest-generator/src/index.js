import fs from 'fs';
import path from 'path';

/**
 * Format a filename or directory name into a readable title
 * @param {string} name - The name to format
 * @returns {string} The formatted title
 */
function formatTitle(name) {
  return name.replace(/\.md$/, '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Parse frontmatter from markdown content
 * @param {string} content - The markdown content
 * @returns {Record<string, any>} The parsed frontmatter data
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\s*([\s\S]*?)\s*---/);
  if (!match) return {};

  const lines = match[1].split('\n');
  const data = {};

  for (const line of lines) {
    const [key, ...rest] = line.split(':');
    if (!key || rest.length === 0) continue;

    const rawValue = rest.join(':').trim();

    if (rawValue.startsWith('[') && rawValue.endsWith(']')) {
      try {
        data[key.trim()] = JSON.parse(rawValue);
      } catch {
        data[key.trim()] = rawValue;
      }
    } else if (rawValue === 'true' || rawValue === 'false') {
      data[key.trim()] = rawValue === 'true';
    } else if (!isNaN(Number(rawValue))) {
      data[key.trim()] = Number(rawValue);
    } else {
      data[key.trim()] = rawValue.replace(/^["']|["']$/g, '');
    }
  }

  return data;
}

/**
 * Walk through docs directory and build navigation structure
 * @param {string} dir - The directory to walk
 * @param {string} relative - The relative path
 * @param {Array} searchIndex - The search index to populate
 * @returns {Array} The navigation items
 */
function walkDocs(dir, relative = '', searchIndex) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  return entries
    .filter(entry => !entry.name.startsWith('.') && entry.name !== 'manifest.json')
    .map(entry => {
      const fullPath = path.join(dir, entry.name);
      const relPath = path.join(relative, entry.name);

      if (entry.isDirectory()) {
        const children = walkDocs(fullPath, relPath, searchIndex);
        if (children.length === 0) return null;

        return {
          title: formatTitle(entry.name),
          children,
        };
      }

      if (entry.isFile() && entry.name.endsWith('.md')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const meta = parseFrontmatter(content);

        if (meta.draft || meta.hidden) return null;

        const cleanPath = relPath.replace(/\.md$/, '').replace(/\\/g, '/');
        const item = {
          title: meta.title || formatTitle(entry.name),
          path: cleanPath,
          tags: meta.tags || [],
        };

        // Add to the search index
        searchIndex.push({
          title: item.title,
          path: cleanPath,
          tags: item.tags,
        });

        return item;
      }

      return null;
    })
    .filter(Boolean);
}

/**
 * Generate documentation manifests for all projects
 * @param {string} docsRoot - The root directory containing documentation projects
 */
function generateDocsManifests(docsRoot) {
  const projects = fs
    .readdirSync(docsRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name);

  projects.forEach(projectName => {
    const projectPath = path.join(docsRoot, projectName);
    const searchIndex = [];
    const manifest = walkDocs(projectPath, '', searchIndex);

    fs.writeFileSync(
      path.join(projectPath, 'manifest.json'),
      JSON.stringify(manifest, null, 2),
      'utf8',
    );

    fs.writeFileSync(
      path.join(projectPath, 'search-index.json'),
      JSON.stringify(searchIndex, null, 2),
      'utf8',
    );

    console.log(`✅ Generated manifest and search index for: ${projectName}`);
  });
}

/**
 * Generate manifest for a single project
 * @param {string} projectPath - The path to the project documentation
 * @returns {Object} The generated manifest and search index
 */
function generateManifest(projectPath) {
  const searchIndex = [];
  const manifest = walkDocs(projectPath, '', searchIndex);

  return {
    manifest,
    searchIndex,
  };
}

/**
 * Auto-discover documentation projects in a directory
 * @param {string} rootDir - The root directory to search
 * @param {Object} options - Discovery options
 * @returns {Array} Array of discovered project paths
 */
function discoverProjects(rootDir, options = {}) {
  const { docsSubfolder = 'docs' } = options;
  const discovered = [];

  try {
    const entries = fs.readdirSync(rootDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) continue;

      const projectPath = path.join(rootDir, entry.name);
      const docsPath = path.join(projectPath, docsSubfolder);

      // Check if this directory has docs
      if (fs.existsSync(docsPath)) {
        const stats = fs.statSync(docsPath);
        if (stats.isDirectory()) {
          discovered.push({
            name: entry.name,
            projectPath,
            docsPath,
            type: 'subfolder',
          });
        }
      }

      // Also check if the project directory itself has .md files
      const hasMdFiles = fs.readdirSync(projectPath, { withFileTypes: true })
        .some(file => file.isFile() && file.name.endsWith('.md'));

      if (hasMdFiles) {
        discovered.push({
          name: entry.name,
          projectPath,
          docsPath: projectPath,
          type: 'direct',
        });
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not scan directory ${rootDir}: ${error.message}`);
  }

  return discovered;
}

/**
 * Generate manifests with automatic discovery and flexible options
 * @param {string} rootDir - The root directory to process
 * @param {Object} options - Processing options
 */
function generateManifestsWithDiscovery(rootDir, options = {}) {
  const {
    project = null,
    route = null,
    outputDir = null,
    docsSubfolder = 'docs',
    autoDetect = true,
  } = options;

  if (route) {
    // Process-specific route
    if (!fs.existsSync(route)) {
      throw new Error(`Route not found: ${route}`);
    }

    const result = generateManifest(route);
    const outputPath = outputDir || path.dirname(route);

    fs.writeFileSync(
      path.join(outputPath, 'manifest.json'),
      JSON.stringify(result.manifest, null, 2),
      'utf8',
    );

    fs.writeFileSync(
      path.join(outputPath, 'search-index.json'),
      JSON.stringify(result.searchIndex, null, 2),
      'utf8',
    );

    console.log(`✅ Generated manifest for route: ${route}`);
    return [{ name: path.basename(route), processed: true }];
  }

  if (project) {
    // Process-specific project
    const projectPath = path.join(rootDir, project);
    const docsPath = path.join(projectPath, docsSubfolder);

    if (!fs.existsSync(projectPath)) {
      throw new Error(`Project not found: ${project}`);
    }

    const targetPath = fs.existsSync(docsPath) ? docsPath : projectPath;
    const result = generateManifest(targetPath);
    const outputPath = outputDir || projectPath;

    fs.writeFileSync(
      path.join(outputPath, 'manifest.json'),
      JSON.stringify(result.manifest, null, 2),
      'utf8',
    );

    fs.writeFileSync(
      path.join(outputPath, 'search-index.json'),
      JSON.stringify(result.searchIndex, null, 2),
      'utf8',
    );

    console.log(`✅ Generated manifest for project: ${project}`);
    return [{ name: project, processed: true }];
  }

  // Auto-discover and process all projects
  if (autoDetect) {
    const discovered = discoverProjects(rootDir, { docsSubfolder });
    const results = [];

    if (discovered.length === 0) {
      console.log('⚠️  No documentation projects found.');
      return results;
    }

    console.log(`📁 Discovered ${discovered.length} project(s):`);
    discovered.forEach(proj => {
      console.log(`  - ${proj.name} (${proj.type}): ${proj.docsPath}`);
    });

    for (const proj of discovered) {
      try {
        const result = generateManifest(proj.docsPath);
        const outputPath = outputDir || proj.projectPath;

        fs.writeFileSync(
          path.join(outputPath, 'manifest.json'),
          JSON.stringify(result.manifest, null, 2),
          'utf8',
        );

        fs.writeFileSync(
          path.join(outputPath, 'search-index.json'),
          JSON.stringify(result.searchIndex, null, 2),
          'utf8',
        );

        console.log(`✅ Generated manifest for: ${proj.name}`);
        results.push({ name: proj.name, processed: true });
      } catch (error) {
        console.error(`❌ Error processing ${proj.name}: ${error.message}`);
        results.push({ name: proj.name, processed: false, error: error.message });
      }
    }

    return results;
  }

  // Fallback to original behavior
  generateDocsManifests(rootDir);
  return [];
}

export {
  formatTitle,
  parseFrontmatter,
  walkDocs,
  generateDocsManifests,
  generateManifest,
  discoverProjects,
  generateManifestsWithDiscovery,
};
