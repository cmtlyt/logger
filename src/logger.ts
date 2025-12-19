import type { Logger, LoggerCtx, LoggerOptions } from './types';
import { normalizeOptions } from './utils';

function getOutputFunc(_type: string, adapters: LoggerCtx<any>['options']['outputAdapters']) {
  const matchAdapter = adapters.find((item) => typeof item(_type) === 'function') || (() => null);
  return matchAdapter(_type) || (({ type, messages }) => console.debug(type, ...messages));
}

const getLogCtrl = (() => {
  const logFuncMap = new Map<PropertyKey, (...messages: any[]) => void>();

  return {
    func: (_type: string, { options }: LoggerCtx<any>) => {
      if (logFuncMap.has(_type)) {
        return logFuncMap.get(_type);
      }

      const outputFunc = getOutputFunc(_type, options.outputAdapters);

      const logFunc = (...messages: any[]) => {
        const data = options.transform(_type, messages);
        options.report(data);

        return outputFunc({ type: _type, messages, transformData: data });
      };

      logFuncMap.set(_type, logFunc);
      return logFunc;
    },
  };
})();

export function createLogger<T>(options?: LoggerOptions<T>): Logger {
  const ctx: LoggerCtx<T> = { options: normalizeOptions(options || {}) };

  return new Proxy(
    {},
    { get: (_, prop: string, receiver) => Reflect.get(ctx, prop, receiver) || getLogCtrl.func(prop, ctx) },
  );
}
