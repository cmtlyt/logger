import type { InfoFunc } from '@/types';

/**
 * 主题配置接口，定义日志输出的颜色主题
 */
export type Theme = {
  /** 主要颜色，支持十六进制、RGB、HSL、渐变等格式 */
  primary: string;
  /** 标签颜色 */
  tagColor: string;
  /** 标题颜色 */
  titleColor: string;
};

/**
 * WebConsoleAdapter 配置选项接口
 * @template T 数据类型
 */
export interface WebConsoleAdapterOptions<T = any> {
  /**
   * 分组配置选项
   */
  group?: {
    /** 是否启用分组，默认为true */
    enable?: boolean;
    /** 是否折叠分组，默认为false */
    collapsed?: boolean;
  };

  /**
   * 控制台输出级别，默认为'info'
   * - debug: 使用console.debug输出
   * - info: 使用console.info输出
   * - log: 使用console.log输出
   * - warn: 使用console.warn输出
   */
  consoleLevel?: 'debug' | 'info' | 'log' | 'warn';

  /**
   * 获取子标题的函数，用于自定义日志的子标题显示
   * @param info 输出信息对象
   * @returns 子标题字符串
   */
  getSubTitle?: InfoFunc<T, string>;

  /**
   * 获取消息内容的函数，用于自定义消息的处理和格式化
   * @param info 输出信息对象
   * @returns 处理后的消息数组，返回null则使用原始消息
   */
  getMessages?: InfoFunc<T, any[] | null>;

  /**
   * 自定义样式函数，用于动态调整主题和基础样式
   * @param info 包含日志类型、主题和基础样式的信息
   * @returns 自定义后的主题和基础样式
   */
  customStyle?: (info: {
    /** 日志类型 */
    type: string;
    /** 当前主题配置 */
    theme: Theme;
    /** 基础样式配置 */
    baseStyle: Record<string, string>;
  }) => {
    /** 自定义后的主题 */
    theme: Theme;
    /** 自定义后的基础样式 */
    baseStyle: Record<string, string>;
  };

  /**
   * 允许的日志类型配置，支持三种模式：
   * - string[]: 扩展模式，在默认类型基础上添加指定类型
   * - Set<string>: 替换模式，完全替换默认类型
   * - function: 函数模式，通过函数判断是否允许某个类型
   *
   * @example
   * ```typescript
   * // 扩展模式：在默认类型基础上添加
   * allowTypes: ['custom', 'special']
   *
   * // 替换模式：完全替换默认类型
   * allowTypes: new Set(['info', 'warn', 'error'])
   *
   * // 函数模式：动态判断
   * allowTypes: (type) => type.startsWith('api')
   * ```
   */
  allowTypes?: string[] | Set<string> | ((type: string) => boolean);

  /**
   * 环境验证函数，用于判断当前环境是否支持WebConsole输出
   * @returns true表示支持，false表示不支持
   * @default () => typeof window !== 'undefined' && typeof console !== 'undefined'
   */
  isEnvironmentValid?: () => boolean;
}

/**
 * WebConsoleAdapter 上下文接口，内部使用
 */
export interface WebConsoleAdapterCtx {
  /** 规范化后的配置选项 */
  options: Required<WebConsoleAdapterOptions> & {
    /** 规范化后的分组配置 */
    group: Required<NonNullable<WebConsoleAdapterOptions['group']>>;
  };
}
