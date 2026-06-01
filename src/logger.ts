import type { Logger, LoggerCtx, LoggerOptions } from './types';
import { normalizeOptions } from './utils';

function getOutputFunc(_type: string, adapters: LoggerCtx<any>['options']['outputAdapters']) {
  const matchAdapter = adapters.find((item) => typeof item(_type) === 'function') || (() => null);
  return matchAdapter(_type) || (({ type, messages }) => console.debug(type, ...messages));
}

const STATUS = {
  pending: 0,
  processing: 1,
  skipping: 1 << 1,
  initializing: 1 << 2,
};

function createLogCtrl(readyPromise: Promise<void>) {
  const logFuncMap = new Map<PropertyKey, (...messages: any[]) => void>();
  const nestingCallsSet = new Set<(depth: number) => void>();
  let status: number = STATUS.initializing;

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

        // 检查是否启用输出（支持函数形式的动态控制）
        let shouldOutput = true;
        try {
          shouldOutput = options.enableOutput({ ...info, data });
        } catch (error) {
          console.error(error);
          shouldOutput = true;
        }

        if (!shouldOutput) {
          return;
        }
        return outputFunc({ type: _type, messages, transformData: data });
      };

      const handleDepthCall = () => {
        for (let i = 1; i <= maxNestingDepth && nestingCallsSet.size; i++) {
          const calls = Array.from(nestingCallsSet);
          nestingCallsSet.clear();
          if (i === maxNestingDepth) {
            status = STATUS.skipping;
          }
          calls.forEach((call) => {
            call(i);
          });
        }
      };

      const readyError = (error: any) => {
        console.warn(error);
        // 拒绝输出
        options.enableOutput = () => false;
      };

      const logFunc = async (...messages: any[]) => {
        if (status === STATUS.initializing) {
          await readyPromise.catch(readyError).finally(() => {
            status = STATUS.pending;
          });
        }
        // 如果正在处理或跳过, 则将调用放入队列
        if (status & (STATUS.processing | STATUS.skipping)) {
          // 如果正在跳过, 则发出警告
          if (status & STATUS.skipping) {
            getOutputFunc(
              'warn',
              options.outputAdapters,
            )({
              type: 'warn',
              messages: [
                `最大嵌套深度 ${maxNestingDepth} 已达到, 跳过调用, 请检查是否在 transform 和 report 中存在 logger 调用, 如果存在的话可以通过参数中的 isNestingCall 参数判断是否为嵌套调用`,
              ],
              transformData: {},
            });
            return;
          }
          nestingCallsSet.add((depth) => processLog(messages, depth));
          return;
        }

        status = STATUS.processing;
        processLog(messages, 0);

        handleDepthCall();

        status = STATUS.pending;
        nestingCallsSet.clear();
      };

      const finalLogFunc = (...args: any[]) => void logFunc(...args);

      logFuncMap.set(_type, finalLogFunc);
      return finalLogFunc;
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
 * @param options.enableOutput 是否启用日志输出，默认为true，设置为false时仍执行transform和report但不输出
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
 * // 禁用日志输出但保留数据处理
 * const disabledOutputLogger = createLogger({ enableOutput: false });
 * disabledOutputLogger.info('这条日志不会输出但transform和report仍会执行');
 *
 * // 使用函数动态控制输出
 * const conditionalLogger = createLogger({
 *   enableOutput: ({ type, data }) => {
 *     // 只在生产环境输出error级别的日志
 *     return process.env.NODE_ENV === 'production' ? type === 'error' : true;
 *   },
 *   transform: ({ type, messages }) => ({ type, messages, timestamp: Date.now() })
 * });
 *
 * // 带配置的用法
 * const logger = createLogger({
 *   enableOutput: true,
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
  const { options: normalizedOptions, readyPromise } = normalizeOptions(options || {});
  const ctx: LoggerCtx<T> = { options: normalizedOptions };
  const logCtrl = createLogCtrl(readyPromise);

  return new Proxy(
    {},
    { get: (_, prop: string, receiver) => Reflect.get(ctx, prop, receiver) || logCtrl.func(prop, ctx) },
  );
}
