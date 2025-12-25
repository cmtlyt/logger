import type yoctocolors from 'yoctocolors';
import type { InfoFunc } from '@/types';

type ColorName = keyof typeof yoctocolors;

export interface ThemeColor {
  /** 类型标签颜色 */
  type: ColorName;
  /** 子标题颜色 */
  label: ColorName;
  /** 日期颜色 */
  date: ColorName;
  /** 消息颜色 */
  message: ColorName;
}

export interface CustomColorizerOptions {
  /** 要着色的文本 */
  text: string;
  /** 颜色名称 */
  colorName: string;
  /** yoctocolors实例 */
  colors: any;
  /** 是否启用颜色 */
  enableColors: boolean;
  /** 当前处理的文本部分类型 */
  part: 'type' | 'label' | 'date' | 'message' | 'othermessages';
}

/**
 * Node.js控制台适配器配置选项接口
 * @template T 数据类型
 */
export interface NodeConsoleAdapterOptions<T = any> {
  /**
   * 是否启用颜色输出，默认为true
   * 当yoctocolors不可用时会自动禁用
   */
  enableColors?: boolean;

  /**
   * 输出级别，默认为'log'
   * - log: 使用console.log输出
   * - info: 使用console.info输出
   * - warn: 使用console.warn输出
   * - error: 使用console.error输出
   */
  outputLevel?: 'log' | 'info' | 'warn' | 'error';

  /**
   * 获取子标题的函数，用于自定义日志的子标题显示
   * @param info 输出信息对象
   * @returns 子标题字符串
   */
  getLabel?: InfoFunc<T, string>;

  /**
   * 获取消息内容的函数，用于自定义消息的处理和格式化
   * @param info 输出信息对象
   * @returns 处理后的消息数组，返回null则使用原始消息
   */
  getMessages?: InfoFunc<T, any[] | null>;

  /**
   * 自定义颜色配置对象
   * @param info 包含日志类型的信息
   * @returns 自定义颜色配置
   */
  customColors?: (info: { type: string }) => Partial<ThemeColor>;

  /**
   * 自定义着色器函数，用于为文本应用颜色
   * @param options 着色器选项对象
   * @returns 着色后的文本
   * @default 使用内置的applyColor函数
   */
  customColorizer?: (options: CustomColorizerOptions) => string;

  /**
   * 允许的日志类型配置，支持三种模式：
   * - string[]: 扩展模式，在默认类型基础上添加指定类型
   * - Set<string>: 替换模式，完全替换默认类型
   * - function: 函数模式，通过函数判断是否允许某个类型
   */
  allowTypes?: string[] | Set<string> | ((type: string) => boolean);

  /**
   * 环境验证函数，用于判断当前环境是否支持Node控制台输出
   * @returns true表示支持，false表示不支持
   * @default () => typeof process !== 'undefined' && typeof console !== 'undefined'
   */
  isEnvironmentValid?: () => boolean;

  /**
   * 日期格式化函数
   * @param date 日期对象
   * @returns 格式化后的日期字符串
   * @default (date) => date.toISOString()
   */
  formatDate?: (date: Date) => string;

  /**
   * 输出格式字符串，支持占位符：
   * - %type: 日志类型
   * - %label: 子标题
   * - %date: 日期时间
   * - %message: 主要消息内容
   * - %othermessages: 其他消息内容
   *
   * @default '[%type][%label][%date] %message %othermessages'
   * @example '[%type]-%date %message' // 输出: [info]-2025-12-24T08:42:18.000Z 用户登录成功
   */
  format?: string;

  /**
   * 自定义文本清理函数，用于处理格式化后的最终文本
   * @param text 格式化后的原始文本
   * @returns 清理后的文本
   * @default 默认清理逻辑：移除空的方括号、合并多个空格、移除首尾空格
   * @example
   * ```typescript
   * // 自定义清理逻辑
   * textCleaner: (text) => {
   *   return text
   *     .replace(/\[\s*\]/g, '') // 移除空的方括号
   *     .replace(/\s+/g, ' ')    // 合并多个空格
   *     .replace(/\(\s*\)/g, '') // 移除空的圆括号
   *     .trim();                 // 移除首尾空格
   * }
   * ```
   */
  textCleaner?: (text: string) => string;
}

/**
 * Node.js控制台适配器上下文接口，内部使用
 */
export interface NodeConsoleAdapterCtx {
  /** 规范化后的配置选项 */
  options: Required<NodeConsoleAdapterOptions>;
  /** yoctocolors实例，可能为null */
  colors: any;
}
