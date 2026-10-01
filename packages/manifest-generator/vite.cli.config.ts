import { builtinModules } from 'node:module';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

/**
 * Builds the CLI entrypoint (`bin` target) as a single Node ESM file at `dist/cli.js`.
 * Runs after the library build, so it must not empty `dist/`.
 */
const nodeBuiltins = builtinModules.flatMap((name) => [name, `node:${name}`]);

export default defineConfig({
  build: {
    ssr: resolve(process.cwd(), 'src/cli.ts'),
    target: 'node22',
    emptyOutDir: false,
    sourcemap: false,
    minify: false,
    rollupOptions: {
      external: [...nodeBuiltins, 'js-yaml'],
      output: {
        format: 'es',
        entryFileNames: 'cli.js',
      },
    },
  },
});
