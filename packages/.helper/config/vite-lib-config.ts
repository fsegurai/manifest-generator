import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

/**
 * Creates a Vite library config for manifest-generator packages
 * Generates ESM, CommonJS, and UMD builds with TypeScript declarations
 *
 * @param {Object} options - Configuration options
 * @param {string} options.umdGlobalName - UMD global variable name (e.g., 'markedExtendedAccordion')
 * @param {string[]} [options.styleFiles] - Style files to copy to dist/styles/ (relative to styles/)
 * @param {string[]} [options.external] - External dependencies to exclude from a bundle
 * @param {Record<string, string>} [options.globals] - Global variable names for external dependencies in UMD builds
 * @param {Record<string, string>} [options.entries] - Extra entry points (name → path relative to the package) built
 *   as ESM + CommonJS (`<name>.esm.js`, `<name>.cjs`) by a second pass run with `vite build --mode entries`.
 *   Declarations come from the main pass, which emits types for every file under `src/`.
 */
export function createLibraryConfig(options: {
  umdGlobalName: string;
  styleFiles?: string[];
  external?: string[];
  globals?: Record<string, string>;
  entries?: Record<string, string>;
}) {
  const { umdGlobalName, external = ['marked'], globals = {}, entries = {} } = options;

  // Build globals object with defaults for known packages
  const defaultGlobals: Record<string, string> = {
    marked: 'marked',
    '@fsegurai/manifest-generator': 'ManifestGenerator',
  };

  // Merge provided globals with defaults, then build globals only for external dependencies
  const mergedGlobals = { ...defaultGlobals, ...globals };
  const umdGlobals: Record<string, string> = {};
  external.forEach((dep) => {
    if (mergedGlobals[dep]) {
      umdGlobals[dep] = mergedGlobals[dep];
    }
  });

  return defineConfig(({ command, mode }) => {
    if (mode === 'entries') {
      const input = Object.fromEntries(
        Object.entries(entries).map(([name, file]) => [name, resolve(process.cwd(), file)]),
      );
      if (Object.keys(input).length === 0) {
        throw new Error('vite build --mode entries requires the `entries` option of createLibraryConfig');
      }
      return {
        build: {
          lib: {
            entry: input,
            formats: ['es', 'cjs'],
            fileName: (format: string, entryName: string) => `${entryName}.${format === 'es' ? 'esm.js' : 'cjs'}`,
          },
          rollupOptions: { external, output: { exports: 'named' as const } },
          sourcemap: command !== 'build',
          emptyOutDir: false,
        },
      };
    }

    return {
      build: {
        lib: {
          entry: resolve(process.cwd(), 'src/index.ts'),
          name: umdGlobalName,
          formats: ['es', 'cjs', 'umd'],
          fileName: (format) => {
            if (format === 'es') return 'index.esm.js';
            if (format === 'cjs') return 'index.cjs';
            if (format === 'umd') return 'index.umd.js';
            return `index.${format}.js`;
          },
        },
        rollupOptions: {
          external,
          output: {
            globals: umdGlobals,
            exports: 'named',
          },
        },
        sourcemap: command !== 'build',
        emptyOutDir: true,
      },
      plugins: [
        dts({
          tsconfigPath: './tsconfig.json',
          outDirs: 'dist/types',
          entryRoot: 'src',
        }),
      ],
    };
  });
}
