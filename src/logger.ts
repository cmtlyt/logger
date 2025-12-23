import type { Logger, LoggerCtx, LoggerOptions } from './types';
import { normalizeOptions } from './utils';

function getOutputFunc(_type: string, adapters: LoggerCtx<any>['options']['outputAdapters']) {
  const matchAdapter = adapters.find((item) => typeof item(_type) === 'function') || (() => null);
  return matchAdapter(_type) || (({ type, messages }) => console.debug(type, ...messages));
}

const STATUS = {
  padding: 0,
  processing: 1,
  skiping: 1 << 1,
};

function createLogCtrl() {
  const logFuncMap = new Map<PropertyKey, (...messages: any[]) => void>();
  const nestingCallsSet = new Set<(depth: number) => void>();
  let status: number = STATUS.padding;

  return {
    func: (_type: string, { options }: LoggerCtx<any>) => {
      const maxNestingDepth = options.maxNestingDepth;

      if (logFuncMap.has(_type)) {
        return logFuncMap.get(_type);
      }

      const outputFunc = getOutputFunc(_type, options.outputAdapters);

      const processLog = (messages: any[], depth: number) => {
        const info = { type: _type, messages, isNestingCall: depth > 0 };
        const data = options.transform(info) || {};
        options.report({ ...info, data });
        return outputFunc({ type: _type, messages, transformData: data });
      };

      const logFunc = (...messages: any[]) => {
        // 如果正在处理或跳过, 则将调用放入队列
        if (status & (STATUS.processing | STATUS.skiping)) {
          // 如果正在跳过, 则发出警告
          if (status & STATUS.skiping) {
            console.warn(
              `最大嵌套深度 ${maxNestingDepth} 已达到, 跳过调用, 请检查是否在 transform 和 report 中存在 logger 调用, 如果存在的话可以通过参数中的 isNestingCall 参数判断是否为嵌套调用`,
            );
            return;
          }
          nestingCallsSet.add((depth) => processLog(messages, depth));
          return;
        }

        status = STATUS.processing;
        processLog(messages, 0);

        for (let i = 1; i <= maxNestingDepth && nestingCallsSet.size; i++) {
          const calls = Array.from(nestingCallsSet);
          nestingCallsSet.clear();
          if (i === maxNestingDepth) {
            status = STATUS.skiping;
          }
          calls.forEach((call) => {
            call(i);
          });
        }

        status = STATUS.padding;
        nestingCallsSet.clear();
      };

      logFuncMap.set(_type, logFunc);
      return logFunc;
    },
  };
}

/**
 * 创建一个 Logger 实例
 *
 * Logger 使用 Proxy 代理实现动态属性访问，任何属性都会返回对应的日志函数。
 * 支持嵌套调用检测和深度控制，防止无限递归和栈溢出。
 *
 * @template T Transform 函数返回的数据类型
 * @param options Logger 配置选项
 * @param options.transform 数据转换函数，用于处理原始日志数据
 * @param options.report 数据上报函数，用于处理转换后的数据
 * @param options.maxNestingDepth 最大嵌套深度，默认为3，主调用不计入深度
 * @param options.outputAdapters 输出适配器数组，用于处理不同类型的日志输出
 * @returns Logger 实例，支持任意属性的日志函数调用
 *
 * @example
 * ```typescript
 * // 基础用法
 * const logger = createLogger();
 * logger.info('Hello', 'World');
 * logger.debug('Debug message');
 * logger.customType('Custom log type');
 *
 * // 带配置的用法
 * const logger = createLogger({
 *   transform: ({ type, messages, isNestingCall }) => {
 *     return { type, messages, timestamp: Date.now(), isNesting: isNestingCall };
 *   },
 *   report: ({ type, messages, data }) => {
 *     console.log('Report:', { type, messages, data });
 *   },
 *   maxNestingDepth: 5,
 *   outputAdapters: [webConsoleAdapter()]
 * });
 *
 * // 嵌套调用示例
 * const logger = createLogger({
 *   transform: ({ type, messages, isNestingCall }) => {
 *     if (type === 'trigger' && !isNestingCall) {
 *       logger.nested('这是嵌套调用'); // 会被标记为 isNestingCall: true
 *     }
 *     return { type, messages, isNestingCall };
 *   }
 * });
 * ```
 */
export function createLogger<T>(options?: LoggerOptions<T>): Logger {
  const ctx: LoggerCtx<T> = { options: normalizeOptions(options || {}) };
  const logCtrl = createLogCtrl();

  return new Proxy(
    {},
    { get: (_, prop: string, receiver) => Reflect.get(ctx, prop, receiver) || logCtrl.func(prop, ctx) },
  );
}
