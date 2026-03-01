// config-manager.js — Read/write config.json with change detection and redaction

import { EventEmitter } from 'node:events';
import { readFileSync, writeFileSync, renameSync, copyFileSync } from 'node:fs';

const SENSITIVE_KEYS = new Set(['apiKey', 'token', 'password']);
const REDACTED = '••••••';

export class ConfigManager extends EventEmitter {
  constructor(configPath) {
    super();
    this._path = configPath;
    this._config = JSON.parse(readFileSync(configPath, 'utf8'));
  }

  /** Return a deep clone of the full config. If options.redact, mask sensitive fields. */
  get(options) {
    const clone = structuredClone(this._config);
    if (options?.redact) redactObj(clone);
    return clone;
  }

  /** Return a deep clone of a single top-level section. */
  getSection(key) {
    if (!(key in this._config)) return undefined;
    return structuredClone(this._config[key]);
  }

  /**
   * Deep-merge partial into config, write atomically, emit 'change'.
   * Values equal to REDACTED ("••••••") are ignored to prevent overwriting secrets.
   */
  update(partial) {
    const changedSections = [];

    for (const key of Object.keys(partial)) {
      const incoming = partial[key];
      const existing = this._config[key];

      // Strip redacted sentinels before merging
      const cleaned = stripRedacted(incoming, existing);

      if (!deepEqual(existing, cleaned)) {
        changedSections.push(key);
      }

      // Deep-merge objects, replace primitives/arrays
      if (isPlainObject(existing) && isPlainObject(cleaned)) {
        this._config[key] = deepMerge(existing, cleaned);
      } else {
        this._config[key] = cleaned;
      }
    }

    if (changedSections.length === 0) return;

    this._writeAtomic();
    this.emit('change', { changedSections });
  }

  // ─── Private ───

  _writeAtomic() {
    const data = JSON.stringify(this._config, null, 2) + '\n';
    const tmpPath = this._path + '.tmp';
    const bakPath = this._path + '.bak';

    // Backup current file
    try {
      copyFileSync(this._path, bakPath);
    } catch {
      // First write or file doesn't exist yet — skip backup
    }

    // Atomic write: tmp → rename
    writeFileSync(tmpPath, data, 'utf8');
    renameSync(tmpPath, this._path);
  }
}

// ─── Helpers ───

function redactObj(obj) {
  if (!isPlainObject(obj) && !Array.isArray(obj)) return;

  if (Array.isArray(obj)) {
    for (const item of obj) redactObj(item);
    return;
  }

  for (const key of Object.keys(obj)) {
    if (SENSITIVE_KEYS.has(key) && typeof obj[key] === 'string' && obj[key].length > 0) {
      obj[key] = REDACTED;
    } else if (isPlainObject(obj[key]) || Array.isArray(obj[key])) {
      redactObj(obj[key]);
    }
  }
}

/**
 * Walk incoming value, replacing REDACTED sentinels with the corresponding
 * existing value so we never overwrite secrets with the placeholder.
 */
function stripRedacted(incoming, existing) {
  if (incoming === REDACTED) {
    // If existing value exists, preserve it; otherwise keep the redacted sentinel
    // so it doesn't accidentally become undefined
    return existing !== undefined ? existing : REDACTED;
  }

  if (Array.isArray(incoming)) {
    return incoming.map((item, i) => {
      const existItem = Array.isArray(existing) ? existing[i] : undefined;
      return stripRedacted(item, existItem);
    });
  }

  if (isPlainObject(incoming)) {
    const result = {};
    for (const key of Object.keys(incoming)) {
      const existVal = isPlainObject(existing) ? existing[key] : undefined;
      result[key] = stripRedacted(incoming[key], existVal);
    }
    return result;
  }

  return incoming;
}

function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (isPlainObject(result[key]) && isPlainObject(source[key])) {
      result[key] = deepMerge(result[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return false;
  if (typeof a !== 'object') return false;

  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, b[i]));
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  return keysA.every((k) => deepEqual(a[k], b[k]));
}
