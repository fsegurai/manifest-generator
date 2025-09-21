import fs from 'fs';
import path from 'path';
import { jest } from '@jest/globals';
import { formatTitle, generateDocsManifests, generateManifest, parseFrontmatter, walkDocs } from '../src/index.js';

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
title: Test Title
tags: ["tag1", "tag2"]
draft: false
---
# Content here`;

      const result = parseFrontmatter(content);
      expect(result).toEqual({
        title: 'Test Title',
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
title: Test Title
malformed line without colon
tags: ["tag1"]
---
# Content`;

      const result = parseFrontmatter(content);
      expect(result).toEqual({
        title: 'Test Title',
        tags: ['tag1'],
      });
    });

    test('should parse different data types', () => {
      const content = `---
title: "Quoted Title"
count: 42
published: true
draft: false
tags: ["web", "docs"]
---
# Content`;

      const result = parseFrontmatter(content);
      expect(result).toEqual({
        title: 'Quoted Title',
        count: 42,
        published: true,
        draft: false,
        tags: ['web', 'docs'],
      });
    });

    test('should handle malformed JSON arrays gracefully', () => {
      const content = `---
title: Test
tags: [invalid json
---
# Content`;

      const result = parseFrontmatter(content);
      expect(result).toEqual({
        title: 'Test',
        tags: '[invalid json',
      });
    });

    test('should handle colons in values', () => {
      const content = `---
title: "Time: 12:30 PM"
url: "https://example.com:8080"
---
# Content`;

      const result = parseFrontmatter(content);
      expect(result).toEqual({
        title: 'Time: 12:30 PM',
        url: 'https://example.com:8080',
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
title: Introduction
tags: ["getting-started"]
---
# Introduction content`;
        }
        if (filePath.includes('guide.md')) {
          return `---
title: User Guide
---
# Guide content`;
        }
        return '';
      });

      const searchIndex = [];
      const result = walkDocs('/docs', '', searchIndex);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        title: 'Introduction',
        path: 'intro',
        tags: ['getting-started'],
      });
      expect(result[1]).toEqual({
        title: 'User Guide',
        path: 'guide',
        tags: [],
      });
      expect(searchIndex).toHaveLength(2);
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
title: Published Article
---
# Content`;
        }
        if (filePath.includes('draft.md')) {
          return `---
title: Draft Article
draft: true
---
# Draft content`;
        }
        if (filePath.includes('hidden.md')) {
          return `---
title: Hidden Article
hidden: true
---
# Hidden content`;
        }
        return '';
      });

      const searchIndex = [];
      const result = walkDocs('/docs', '', searchIndex);

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Published Article');
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
title: Introduction
---
# Intro`;
        }
        if (filePath.includes('basic.md')) {
          return `---
title: Basic Guide
---
# Basic content`;
        }
        return '';
      });

      const searchIndex = [];
      const result = walkDocs('/docs', '', searchIndex);

      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Introduction');
      expect(result[1]).toEqual({
        title: 'Guides',
        children: [{
          title: 'Basic Guide',
          path: 'guides/basic',
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
title: Visible File
---
# Content`);

      const searchIndex = [];
      const result = walkDocs('/docs', '', searchIndex);

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Visible File');
    });

    test('should handle Windows paths correctly', () => {
      const mockDirents = [
        { name: 'guide.md', isDirectory: () => false, isFile: () => true },
      ];

      fs.readdirSync.mockReturnValue(mockDirents);
      fs.readFileSync.mockReturnValue(`---
title: Guide
---
# Content`);

      // Mock path.join to return Windows-style paths
      jest.spyOn(path, 'join').mockImplementation((...args) => {
        return args.join('\\');
      });

      const searchIndex = [];
      const result = walkDocs('C:\\docs', 'subdir', searchIndex);

      expect(result[0].path).toBe('subdir/guide');
      expect(searchIndex[0].path).toBe('subdir/guide');

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
title: Test File
---
# Content`);

      const searchIndex = [];
      const result = walkDocs('/docs', '', searchIndex);

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Test File');
    });
  });

  describe('generateManifest', () => {
    test('should generate manifest and search index', () => {
      const mockDirents = [
        { name: 'intro.md', isDirectory: () => false, isFile: () => true },
      ];

      fs.readdirSync.mockReturnValue(mockDirents);
      fs.readFileSync.mockReturnValue(`---
title: Introduction
tags: ["basics"]
---
# Introduction`);

      const result = generateManifest('/docs/project');

      expect(result).toHaveProperty('manifest');
      expect(result).toHaveProperty('searchIndex');
      expect(result.manifest).toHaveLength(1);
      expect(result.searchIndex).toHaveLength(1);
      expect(result.manifest[0]).toEqual({
        title: 'Introduction',
        path: 'intro',
        tags: ['basics'],
      });
      expect(result.searchIndex[0]).toEqual({
        title: 'Introduction',
        path: 'intro',
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
title: README
---
# Content`);

      const writeFileSyncSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation();
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      generateDocsManifests('/docs');

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
        expect(content).toContain('"title": "README"');
        expect(content).toContain('"path": "readme"');
        expect(encoding).toBe('utf8');
      });

      searchIndexCalls.forEach(call => {
        const [filePath, content, encoding] = call;
        expect(filePath).toMatch(/project[12][/\\]search-index\.json$/);
        expect(content).toContain('"title": "README"');
        expect(content).toContain('"path": "readme"');
        expect(encoding).toBe('utf8');
      });

      // Should log success messages for both projects
      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
      expect(consoleLogSpy).toHaveBeenCalledWith('✅ Generated manifest and search index for: project1');
      expect(consoleLogSpy).toHaveBeenCalledWith('✅ Generated manifest and search index for: project2');

      writeFileSyncSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    test('should handle empty docs directory', () => {
      fs.readdirSync.mockReturnValue([]);

      const writeFileSyncSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation();
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      generateDocsManifests('/empty-docs');

      expect(writeFileSyncSpy).not.toHaveBeenCalled();
      expect(consoleLogSpy).not.toHaveBeenCalled();

      writeFileSyncSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });
  });
});
