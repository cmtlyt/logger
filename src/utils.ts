import type { LoggerCtx, LoggerOptions } from './types';

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
    outputAdapters,
    maxNestingDepth: options.maxNestingDepth || 3,
    transform: options.transform || (() => void 0),
    report: options.report || (() => void 0),
  };
}
