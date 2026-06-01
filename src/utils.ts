import type { LoggerCtx, LoggerOptions } from './types';

function normalizeEnableOutput<T>(
  enableOutput: LoggerOptions<T>['enableOutput'],
): LoggerCtx<T>['options']['enableOutput'] {
  if (enableOutput == null) {
    return () => true;
  }
  if (typeof enableOutput === 'function') {
    return enableOutput;
  }
  return () => enableOutput;
}

export function withResolvers<T>() {
  const resolvers = {} as { resolve: (value: T) => void; reject: (reason?: any) => void; promise: Promise<T> };

  resolvers.promise = new Promise((resolve, reject) => {
    resolvers.resolve = resolve;
    resolvers.reject = reject;
  });

  return resolvers;
}

export function isPromise(value: any): value is Promise<any> {
  return typeof value === 'object' && value != null && typeof (value as any).then === 'function';
}

export function parseOutputAdapters(
  options: LoggerOptions<any>,
  resolvers: { reject: (reason?: any) => void; resolve: () => void },
) {
  // biome-ignore lint/style/noNonNullAssertion: 已经在外部校验
  const tempAdapters = options.outputAdapters!.filter(Boolean).slice();
  const outputAdapters = new Array(tempAdapters.length);

  void (async () => {
    try {
      for (let i = 0; i < tempAdapters.length; i++) {
        const item = tempAdapters[i];
        if (typeof item === 'function') {
          outputAdapters[i] = item;
        } else if (isPromise(item)) {
          const temp = await item;
          if (isPromise(temp)) {
            throw new TypeError('outputAdapters must not be nested promise');
          }
          tempAdapters[i--] = temp;
        } else {
          outputAdapters[i] = (type: string) => item[type];
        }
      }
      resolvers.resolve();
    } catch (err) {
      resolvers.reject(err);
    }
  })();

  return outputAdapters;
}

/**
 * 规范化Logger配置选项，将用户输入转换为内部使用的标准格式
 *
 * 主要功能：
 * - 处理输出适配器的不同输入格式（函数、对象、数组）
 * - 设置默认的最大嵌套深度
 * - 提供默认的转换和报告函数
 * - 过滤无效的适配器
 *
 * @template T 数据类型
 * @param options 用户提供的Logger配置选项
 * @returns 规范化后的配置选项
 * @throws {TypeError} 当outputAdapters不是数组时抛出类型错误
 *
 * @example
 * ```typescript
 * const options = {
 *   outputAdapters: [webConsoleAdapter(), customAdapter],
 *   maxNestingDepth: 5,
 *   transform: (data) => ({ ...data, timestamp: Date.now() })
 * };
 *
 * const normalizedOptions = normalizeOptions(options);
 * // 返回标准化的配置对象
 * ```
 */
export function normalizeOptions<T>(options: LoggerOptions<T>): {
  options: LoggerCtx<T>['options'];
  readyPromise: Promise<void>;
} {
  let outputAdapters: LoggerCtx<any>['options']['outputAdapters'] = [];
  const resolvers = withResolvers<void>();

  if (options.outputAdapters == null) {
    outputAdapters = [];
    resolvers.resolve();
  } else if (Array.isArray(options.outputAdapters)) {
    outputAdapters = parseOutputAdapters(options, resolvers);
  } else {
    throw new TypeError('outputAdapters must be an array');
  }

  return {
    options: {
      enableOutput: normalizeEnableOutput(options.enableOutput),
      outputAdapters,
      maxNestingDepth: options.maxNestingDepth || 3,
      transform: options.transform || (() => void 0),
      report: options.report || (() => void 0),
    },
    readyPromise: resolvers.promise,
  };
}
