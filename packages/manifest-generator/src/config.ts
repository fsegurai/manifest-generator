import fs from 'node:fs';
import path from 'node:path';
import type { ConfigFile } from './types.js';

export function defineConfig(config: ConfigFile): ConfigFile {
  return config;
}

const CONFIG_CANDIDATES = [
  'manifest-generator.config.ts',
  'manifest-generator.config.js',
  'manifest-generator.config.json',
];

function findConfigPath(rootDir: string): string | null {
  for (const file of CONFIG_CANDIDATES) {
    const fullPath = path.join(rootDir, file);
    if (fs.existsSync(fullPath)) return fullPath;
  }
  return null;
}

export function loadConfig(rootDir: string): Partial<ConfigFile> {
  const configPath = findConfigPath(rootDir);
  if (!configPath) return {};

  const ext = path.extname(configPath);
  if (ext === '.json') {
    return JSON.parse(fs.readFileSync(configPath, 'utf8')) as Partial<ConfigFile>;
  }

  try {
    const data = fs.readFileSync(configPath, 'utf8');
    const cleaned = data
      .replace(/\/\/.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^import\s+.*$/gm, '')
      .replace(/^export\s+default\s+/, '')
      .replace(/;\s*$/, '')
      .trim();

    const obj = Function(`"use strict"; return (${cleaned})`)();
    const config = (obj as { default?: ConfigFile })?.default || (obj as ConfigFile);

    if (typeof config !== 'object' || config === null) return {};
    return config as Partial<ConfigFile>;
  } catch {
    console.warn(`Warning: Could not parse config file ${configPath}`);
    return {};
  }
}

export function mergeConfig<T extends Record<string, unknown>>(
  cliFlags: Partial<T>,
  configFile: Partial<T>,
  defaults: T,
): T {
  const result = { ...defaults };
  for (const key of Object.keys(configFile) as (keyof T)[]) {
    const val = configFile[key];
    if (val !== undefined && val !== null) {
      result[key] = val;
    }
  }
  for (const key of Object.keys(cliFlags) as (keyof T)[]) {
    const val = cliFlags[key];
    if (val !== undefined && val !== null) {
      result[key] = val;
    }
  }
  return result;
}
