import type { OutputAdapter } from '../types';

/**
 * 定义输出适配器的辅助函数，提供类型安全的适配器创建
 *
 * @template T 数据类型
 * @template C 回调函数类型
 * @param callback 适配器创建函数
 * @returns 原始回调函数，但具有正确的类型推断
 *
 * @example
 * ```typescript
 * const myAdapter = defineAdapter((options) => {
 *   return (type) => {
 *     // 适配器逻辑
 *     return outputFunc;
 *   };
 * });
 * ```
 */
export function defineAdapter<T, C extends (...args: any[]) => OutputAdapter<T>>(callback: C): C {
  return callback;
}

/**
 * 将对象转换为格式化的JSON字符串，支持函数和循环引用处理
 *
 * 特性：
 * - 自动处理函数类型，保留函数定义
 * - 检测并标记循环引用，避免无限递归
 * - 使用非断行空格进行缩进，保持格式美观
 *
 * @param obj 要序列化的对象
 * @returns 格式化的JSON字符串
 *
 * @example
 * ```typescript
 * const obj = {
 *   name: 'test',
 *   fn: () => console.log('hello'),
 *   circular: null
 * };
 * obj.circular = obj; // 创建循环引用
 *
 * const result = objectStringify(obj);
 * // 输出包含函数定义和循环引用标记的格式化字符串
 * ```
 */
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

/**
 * 检测当前环境是否为Web浏览器环境
 *
 * 通过检查全局对象中是否存在window对象来判断运行环境
 *
 * @returns true表示Web环境，false表示非Web环境（如Node.js）
 *
 * @example
 * ```typescript
 * if (isWeb()) {
 *   // 在浏览器环境中执行的代码
 *   console.log('Running in browser');
 * } else {
 *   // 在Node.js或其他环境中执行的代码
 *   console.log('Running in Node.js');
 * }
 * ```
 */
export function isWeb() {
  return typeof globalThis.window !== 'undefined';
}
