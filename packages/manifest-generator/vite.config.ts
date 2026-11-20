import { createLibraryConfig } from '../.helper/config/vite-lib-config';

export default createLibraryConfig({
  umdGlobalName: 'manifestGenerator',
  /**
   * Required since Vite does not automatically polyfill Node.js modules in library mode. We need to mark them as external to avoid bundling them.
   */
  external: ['node:fs', 'node:path', 'node:util'],
  /**
   * Node-free subpath entries (`@fsegurai/manifest-generator/core`, `/schema`), built by `vite build --mode entries`.
   */
  entries: { core: 'src/core.ts', schema: 'src/schema.ts' },
  globals: {
    'node:fs': 'node:fs',
    'node:path': 'node:path',
    'node:util': 'node:util',
  },
});
