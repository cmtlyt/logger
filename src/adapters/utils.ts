import type { OutputAdapter } from '../types';

export function defineAdapter<T, C extends (...args: any[]) => OutputAdapter<T>>(callback: C): C {
  return callback;
}

export function objectStringify(obj: any) {
  const map = new Map<any, string>();

  return JSON.stringify(
    obj,
    (key, value) => {
      if (typeof value === 'function') {
        const funcStr = value.toString();
        return funcStr.includes('=>') || funcStr.startsWith('function') ? funcStr : `function ${funcStr}`;
      }
      if (typeof value === 'object') {
        if (map.has(value)) {
          const cirKey = map.get(value);
          return `[Circular ${cirKey ? `key: ${cirKey}` : 'self'}]`;
        }
        map.set(value, key);
      }
      return value;
    },
    2,
    // \u00A0 is a non-breaking space
  ).replace(/\n(\s+)/g, (_, { length }) => `\n${'\u00A0'.repeat(length)}`);
}

export function isWeb() {
  return typeof globalThis.window !== 'undefined';
}
