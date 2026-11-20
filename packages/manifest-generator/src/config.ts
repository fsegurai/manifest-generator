import fs from 'node:fs';
import path from 'node:path';
import { ALLOWED_FRONTMATTER_KEYS } from './core.js';
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

/** Config keys that turn an output option on or off. */
const BOOLEAN_KEYS = ['prevNext', 'headingAnchors', 'extraFrontmatter', 'readingTime'] as const;

/**
 * Checks the types of the output option keys (`prevNext`, `headingAnchors`, `extraFrontmatter`, `readingTime`),
 * `frontmatterAliases` and `ignoreKeys`, and that every alias maps to a known frontmatter key. Throws an `Error` naming
 * the key; other keys are left as they are.
 */
export function validateConsumerKeys(config: Partial<ConfigFile>): Partial<ConfigFile> {
  const { frontmatterAliases, ignoreKeys } = config as Record<string, unknown>;
  for (const key of BOOLEAN_KEYS) {
    const value = (config as Record<string, unknown>)[key];
    if (value !== undefined && typeof value !== 'boolean') {
      throw new Error(`Invalid config: "${key}" must be a boolean`);
    }
  }
  if (ignoreKeys !== undefined && !(Array.isArray(ignoreKeys) && ignoreKeys.every((key) => typeof key === 'string'))) {
    throw new Error('Invalid config: "ignoreKeys" must be an array of strings');
  }
  if (frontmatterAliases !== undefined) {
    const isMapping =
      typeof frontmatterAliases === 'object' &&
      frontmatterAliases !== null &&
      !Array.isArray(frontmatterAliases) &&
      Object.values(frontmatterAliases).every((target) => typeof target === 'string');
    if (!isMapping) {
      throw new Error('Invalid config: "frontmatterAliases" must be an object mapping frontmatter keys to keys');
    }
    for (const [from, to] of Object.entries(frontmatterAliases as Record<string, string>)) {
      if (!ALLOWED_FRONTMATTER_KEYS.has(to)) {
        throw new Error(`Invalid config: frontmatterAliases: "${from}" maps to unknown frontmatter key "${to}"`);
      }
    }
  }
  return config;
}

export function parseConfigFile(configPath: string): Partial<ConfigFile> {
  return validateConsumerKeys(readConfigFile(configPath));
}

function readConfigFile(configPath: string): Partial<ConfigFile> {
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

export function loadConfig(rootDir: string): Partial<ConfigFile> {
  const configPath = findConfigPath(rootDir);
  if (!configPath) return {};

  return parseConfigFile(configPath);
}

export function loadConfigFromFile(filePath: string): Partial<ConfigFile> {
  const resolvedPath = path.resolve(filePath);
  if (!fs.existsSync(resolvedPath)) {
    console.warn(`Warning: Config file not found: ${resolvedPath}`);
    return {};
  }

  return parseConfigFile(resolvedPath);
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
