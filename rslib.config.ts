import { defineConfig } from '@rslib/core';

export default defineConfig({
  source: {
    entry: {
      index: './src/index.ts',
      'adapters/index': './src/adapters/index.ts',
      'adapters/web/index': './src/adapters/web/index.ts',
    },
  },
  lib: [
    { format: 'esm', syntax: ['node 18'], dts: true },
    { format: 'cjs', syntax: ['node 18'] },
  ],
});
