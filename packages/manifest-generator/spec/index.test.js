import fs from 'fs';
import path from 'path';
import { jest } from '@jest/globals';
import { formatTitle, generateDocsManifests, generateManifest, parseFrontmatter, walkDocs, cleanItem } from '../src/index.js';

// Mock fs module
jest.mock('fs');

describe('Manifest Generator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('formatTitle', () => {
    test('should format basic filename', () => {
      expect(formatTitle('hello-world.md')).toBe('Hello World');
    });

    test('should handle filename without extension', () => {
      expect(formatTitle('hello-world')).toBe('Hello World');
    });

    test('should handle single word', () => {
      expect(formatTitle('introduction')).toBe('Introduction');
    });

    test('should handle multiple dashes', () => {
      expect(formatTitle('getting-started-guide')).toBe('Getting Started Guide');
    });

    test('should handle mixed case', () => {
      expect(formatTitle('API-reference.md')).toBe('API Reference');
    });
  });

  describe('parseFrontmatter', () => {
    test('should parse basic frontmatter', () => {
      const content = `---
label: Test Title
tags: ["tag1", "tag2"]
draft: false
---
# Content here`;

      const result = parseFrontmatter(content);
      expect(result).toEqual({
        label: 'Test Title',
        tags: ['tag1', 'tag2'],
        draft: false,
      });
    });

    test('should handle empty frontmatter', () => {
      const content = '# No frontmatter here';
      const result = parseFrontmatter(content);
      expect(result).toEqual({});
    });

    test('should handle malformed frontmatter', () => {
      const content = `---
label: Test Title
malformed line without colon
tags: ["tag1"]
---
# Content`;

      const result = parseFrontmatter(content);
      expect(result).toEqual({
        label: 'Test Title',
        tags: ['tag1'],
      });
    });

    test('should parse different data types', () => {
      const content = `---
label: "Quoted Title"
count: 42
published: true
draft: false
tags: ["web", "docs"]
---
# Content`;

      const result = parseFrontmatter(content);
      expect(result).toEqual({
        label: 'Quoted Title',
        count: 42,
        published: true,
        draft: false,
        tags: ['web', 'docs'],
      });
    });

    test('should handle malformed JSON arrays gracefully', () => {
      const content = `---
label: Test
tags: [invalid json
---
# Content`;

      const result = parseFrontmatter(content);
      expect(result).toEqual({
        label: 'Test',
        tags: '[invalid json',
      });
    });

    test('should handle colons in values', () => {
      const content = `---
label: "Time: 12:30 PM"
url: "https://example.com:8080"
---
# Content`;

      const result = parseFrontmatter(content);
      expect(result).toEqual({
        label: 'Time: 12:30 PM',
        url: 'https://example.com:8080',
      });
    });
  });

  describe('cleanItem', () => {
    test('should remove null, false, empty string and undefined values', () => {
      const item = {
        label: 'Test',
        description: '',
        route: 'test',
        tags: [],
        icon: null,
        badge: false,
        badgeColor: undefined,
        isTitle: true,
      };

      const result = cleanItem(item);
      expect(result).toEqual({
        label: 'Test',
        route: 'test',
        tags: [],
        isTitle: true,
      });
    });

    test('should clean children recursively', () => {
      const item = {
        label: 'Parent',
        route: 'parent',
        children: [
          {
            label: 'Child',
            route: 'child',
            icon: null,
            badge: false,
          },
        ],
      };

      const result = cleanItem(item);
      expect(result).toEqual({
        label: 'Parent',
        route: 'parent',
        children: [
          {
            label: 'Child',
            route: 'child',
          },
        ],
      });
    });
  });

  describe('walkDocs', () => {
    test('should process markdown files correctly', () => {
      const mockDirents = [
        { name: 'intro.md', isDirectory: () => false, isFile: () => true },
        { name: 'guide.md', isDirectory: () => false, isFile: () => true },
      ];

      fs.readdirSync.mockReturnValue(mockDirents);
      fs.readFileSync.mockImplementation((filePath) => {
        if (filePath.includes('intro.md')) {
          return `---
label: Introduction
tags: ["getting-started"]
---
# Introduction content`;
        }
        if (filePath.includes('guide.md')) {
          return `---
label: User Guide
---
# Guide content`;
        }
        return '';
      });

      const searchIndex = [];
      const result = walkDocs('/docs', '', searchIndex);

      expect(result).toHaveLength(2);
      // Only include properties that won't be cleaned out
      expect(result[0]).toEqual({
        label: 'Introduction',
        route: 'intro',
        tags: ['getting-started'],
      });
      expect(result[1]).toEqual({
        label: 'User Guide',
        route: 'guide',
        tags: [],
      });
      expect(searchIndex).toHaveLength(2);
      expect(searchIndex[0]).toEqual({
        label: 'Introduction',
        description: '',
        route: 'intro',
        tags: ['getting-started'],
      });
    });

    test('should filter out draft and hidden files', () => {
      const mockDirents = [
        { name: 'published.md', isDirectory: () => false, isFile: () => true },
        { name: 'draft.md', isDirectory: () => false, isFile: () => true },
        { name: 'hidden.md', isDirectory: () => false, isFile: () => true },
      ];

      fs.readdirSync.mockReturnValue(mockDirents);
      fs.readFileSync.mockImplementation((filePath) => {
        if (filePath.includes('published.md')) {
          return `---
label: Published Article
---
# Content`;
        }
        if (filePath.includes('draft.md')) {
          return `---
label: Draft Article
draft: true
---
# Draft content`;
        }
        if (filePath.includes('hidden.md')) {
          return `---
label: Hidden Article
hidden: true
---
# Hidden content`;
        }
        return '';
      });

      const searchIndex = [];
      const result = walkDocs('/docs', '', searchIndex);

      expect(result).toHaveLength(1);
      expect(result[0].label).toBe('Published Article');
      expect(searchIndex).toHaveLength(1);
    });

    test('should handle directories recursively', () => {
      const mockRootDirents = [
        { name: 'intro.md', isDirectory: () => false, isFile: () => true },
        { name: 'guides', isDirectory: () => true, isFile: () => false },
      ];

      const mockSubDirents = [
        { name: 'basic.md', isDirectory: () => false, isFile: () => true },
      ];

      fs.readdirSync.mockImplementation((dirPath) => {
        if (dirPath.includes('guides')) {
          return mockSubDirents;
        }
        return mockRootDirents;
      });

      fs.readFileSync.mockImplementation((filePath) => {
        if (filePath.includes('intro.md')) {
          return `---
label: Introduction
---
# Intro`;
        }
        if (filePath.includes('basic.md')) {
          return `---
label: Basic Guide
---
# Basic content`;
        }
        return '';
      });

      const searchIndex = [];
      const result = walkDocs('/docs', '', searchIndex);

      expect(result).toHaveLength(2);
      expect(result[0].label).toBe('Introduction');
      expect(result[1]).toEqual({
        label: 'Guides',
        route: 'guides',
        isParent: true,
        children: [{
          label: 'Basic Guide',
          route: 'guides/basic',
          tags: [],
        }],
      });
      expect(searchIndex).toHaveLength(2);
    });

    test('should filter out hidden files and manifest.json', () => {
      const mockDirents = [
        { name: '.hidden', isDirectory: () => false, isFile: () => true },
        { name: 'manifest.json', isDirectory: () => false, isFile: () => true },
        { name: 'visible.md', isDirectory: () => false, isFile: () => true },
      ];

      fs.readdirSync.mockReturnValue(mockDirents);
      fs.readFileSync.mockReturnValue(`---
label: Visible File
---
# Content`);

      const searchIndex = [];
      const result = walkDocs('/docs', '', searchIndex);

      expect(result).toHaveLength(1);
      expect(result[0].label).toBe('Visible File');
    });

    test('should handle Windows paths correctly', () => {
      const mockDirents = [
        { name: 'guide.md', isDirectory: () => false, isFile: () => true },
      ];

      fs.readdirSync.mockReturnValue(mockDirents);
      fs.readFileSync.mockReturnValue(`---
label: Guide
---
# Content`);

      // Mock path.join to return Windows-style paths
      jest.spyOn(path, 'join').mockImplementation((...args) => {
        return args.join('\\');
      });

      const searchIndex = [];
      const result = walkDocs('C:\\docs', 'subdir', searchIndex);

      expect(result[0].route).toBe('subdir/guide');
      expect(searchIndex[0].route).toBe('subdir/guide');

      // Restore original path.join
      path.join.mockRestore();
    });

    test('should skip empty directories', () => {
      const mockRootDirents = [
        { name: 'empty-dir', isDirectory: () => true, isFile: () => false },
        { name: 'file.md', isDirectory: () => false, isFile: () => true },
      ];

      fs.readdirSync.mockImplementation((dirPath) => {
        if (dirPath.includes('empty-dir')) {
          return [];
        }
        return mockRootDirents;
      });

      fs.readFileSync.mockReturnValue(`---
label: Test File
---
# Content`);

      const searchIndex = [];
      const result = walkDocs('/docs', '', searchIndex);

      expect(result).toHaveLength(1);
      expect(result[0].label).toBe('Test File');
    });

    test('should handle title nodes with route="#"', () => {
      const mockDirents = [
        { name: 'title-node.md', isDirectory: () => false, isFile: () => true },
        { name: 'regular.md', isDirectory: () => false, isFile: () => true },
      ];

      fs.readdirSync.mockReturnValue(mockDirents);
      fs.readFileSync.mockImplementation((filePath) => {
        if (filePath.includes('title-node.md')) {
          return `---
label: Section Title
isTitle: true
---
# Title`;
        }
        if (filePath.includes('regular.md')) {
          return `---
label: Regular Page
---
# Content`;
        }
        return '';
      });

      const searchIndex = [];
      const result = walkDocs('/docs', '', searchIndex);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        label: 'Section Title',
        route: '#',
        tags: [],
        isTitle: true,
      });

      // Title nodes should not be added to search index
      expect(searchIndex).toHaveLength(1);
      expect(searchIndex[0].label).toBe('Regular Page');
    });

    test('should handle all frontmatter properties', () => {
      const mockDirents = [
        { name: 'full-meta.md', isDirectory: () => false, isFile: () => true },
      ];

      fs.readdirSync.mockReturnValue(mockDirents);
      fs.readFileSync.mockReturnValue(`---
label: Full Metadata
description: Test description
tags: ["test", "example"]
isTitle: false
isParent: true
icon: "star"
iconType: "solid"
badge: "new"
badgeColor: "blue"
---
# Content`);

      const searchIndex = [];
      const result = walkDocs('/docs', '', searchIndex);

      // isTitle: false gets cleaned out, but isParent: true stays
      expect(result[0]).toEqual({
        label: 'Full Metadata',
        description: 'Test description',
        route: 'full-meta',
        tags: ['test', 'example'],
        isParent: true,
        icon: 'star',
        iconType: 'solid',
        badge: 'new',
        badgeColor: 'blue',
      });
    });
  });

  describe('generateManifest', () => {
    test('should generate manifest and search index', () => {
      const mockDirents = [
        { name: 'intro.md', isDirectory: () => false, isFile: () => true },
      ];

      fs.readdirSync.mockReturnValue(mockDirents);
      fs.readFileSync.mockReturnValue(`---
label: Introduction
tags: ["basics"]
---
# Introduction`);

      const result = generateManifest('/docs/project');

      expect(result).toHaveProperty('manifest');
      expect(result).toHaveProperty('searchIndex');
      expect(result.manifest).toHaveLength(1);
      expect(result.searchIndex).toHaveLength(1);
      // After cleaning, false and empty string properties are removed
      expect(result.manifest[0]).toEqual({
        label: 'Introduction',
        route: 'intro',
        tags: ['basics'],
      });
      expect(result.searchIndex[0]).toEqual({
        label: 'Introduction',
        description: '',
        route: 'intro',
        tags: ['basics'],
      });
    });
  });

  describe('generateDocsManifests', () => {
    test('should generate manifests for multiple projects', () => {
      const mockProjects = [
        { name: 'project1', isDirectory: () => true },
        { name: 'project2', isDirectory: () => true },
        { name: 'file.txt', isDirectory: () => false }, // Should be filtered out
      ];

      const mockFileDirents = [
        { name: 'readme.md', isDirectory: () => false, isFile: () => true },
      ];

      fs.readdirSync.mockImplementation((dirPath) => {
        if (dirPath.endsWith('docs')) {
          return mockProjects;
        }
        return mockFileDirents;
      });

      fs.readFileSync.mockReturnValue(`---
label: README
---
# Content`);

      const writeFileSyncSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation();
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = generateDocsManifests('/docs');

      // Should write 4 files total (2 projects × 2 files each)
      expect(writeFileSyncSpy).toHaveBeenCalledTimes(4);

      // Get all the calls to writeFileSync
      const calls = writeFileSyncSpy.mock.calls;

      // Check that manifest.json files are written for both projects
      const manifestCalls = calls.filter(call => call[0].includes('manifest.json'));
      expect(manifestCalls).toHaveLength(2);

      // Check that search-index.json files are written for both projects
      const searchIndexCalls = calls.filter(call => call[0].includes('search-index.json'));
      expect(searchIndexCalls).toHaveLength(2);

      // Verify the content structure of written files
      manifestCalls.forEach(call => {
        const [filePath, content, encoding] = call;
        expect(filePath).toMatch(/project[12][/\\]manifest\.json$/);
        expect(content).toContain('"label": "README"');
        expect(content).toContain('"route": "readme"');
        expect(encoding).toBe('utf8');
      });

      searchIndexCalls.forEach(call => {
        const [filePath, content, encoding] = call;
        expect(filePath).toMatch(/project[12][/\\]search-index\.json$/);
        expect(content).toContain('"label": "README"');
        expect(content).toContain('"route": "readme"');
        expect(encoding).toBe('utf8');
      });

      // Should log success messages for both projects
      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
      expect(consoleLogSpy).toHaveBeenCalledWith('✅ Generated manifest and search index for: project1');
      expect(consoleLogSpy).toHaveBeenCalledWith('✅ Generated manifest and search index for: project2');

      // Should return results array
      expect(result).toEqual([
        { name: 'project1', processed: true },
        { name: 'project2', processed: true },
      ]);

      writeFileSyncSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    test('should handle empty docs directory', () => {
      fs.readdirSync.mockReturnValue([]);

      const writeFileSyncSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation();
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = generateDocsManifests('/empty-docs');

      expect(writeFileSyncSpy).not.toHaveBeenCalled();
      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(result).toEqual([]);

      writeFileSyncSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    test('should handle projects with invalid manifests', () => {
      const mockProjects = [
        { name: 'valid-project', isDirectory: () => true },
        { name: 'invalid-project', isDirectory: () => true },
      ];

      fs.readdirSync.mockImplementation((dirPath) => {
        if (dirPath.endsWith('docs')) {
          return mockProjects;
        }
        if (dirPath.includes('valid-project')) {
          return [{ name: 'readme.md', isDirectory: () => false, isFile: () => true }];
        }
        if (dirPath.includes('invalid-project')) {
          return []; // Empty directory - this results in empty array manifest
        }
        return [];
      });

      fs.readFileSync.mockReturnValue(`---
label: README
---
# Content`);

      const writeFileSyncSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation();
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = generateDocsManifests('/docs');

      // Both projects will write files - valid project writes files with content,
      // invalid project writes empty manifest and search index files
      expect(writeFileSyncSpy).toHaveBeenCalledTimes(4);
      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
      expect(consoleLogSpy).toHaveBeenCalledWith('✅ Generated manifest and search index for: valid-project');
      expect(consoleLogSpy).toHaveBeenCalledWith('✅ Generated manifest and search index for: invalid-project');

      // No warnings should be generated since empty array is still valid
      expect(consoleWarnSpy).not.toHaveBeenCalled();

      // Both projects should be in results
      expect(result).toEqual([
        { name: 'valid-project', processed: true },
        { name: 'invalid-project', processed: true },
      ]);

      writeFileSyncSpy.mockRestore();
      consoleLogSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });
  });
});
