import type { LoggerCtx, LoggerOptions } from './types';

export function normalizeOptions<T>(options: LoggerOptions<T>): LoggerCtx<T>['options'] {
  let outputAdapters: LoggerCtx<any>['options']['outputAdapters'];

  if (options.outputAdapters == null) {
    outputAdapters = [];
  } else if (Array.isArray(options.outputAdapters)) {
    outputAdapters = options.outputAdapters
      .filter(Boolean)
      .map((item) => (typeof item === 'function' ? item : (type) => item[type]));
  } else {
    throw new TypeError('outputAdapters must be an array');
  }

  return {
    // @ts-expect-error
    transform: options.transform || (() => void 0),
    report: options.report || (() => void 0),
    outputAdapters,
  };
}
