import { createLibraryConfig } from '../.helper/config/vite-lib-config';

export default createLibraryConfig({
  umdGlobalName: 'manifestGenerator',
  /**
   * Required since Vite does not automatically polyfill Node.js modules in library mode. We need to mark them as external to avoid bundling them.
   */
  external: ['node:fs', 'node:path', 'node:util'],
  globals: {
    'node:fs': 'node:fs',
    'node:path': 'node:path',
    'node:util': 'node:util',
  },
});
