/**
 * 输出信息接口，包含日志类型、消息内容和转换后的数据
 * @template T 转换数据的类型
 */
export interface OuputInfo<T = any> {
  /** 日志类型，如 'info', 'debug', 'warn' 等 */
  type: string;
  /** 原始消息数组 */
  messages: any[];
  /** 经过 transform 函数处理后的数据 */
  transformData: T;
}

/**
 * 信息处理函数类型
 * @template T 输入数据类型
 * @template R 返回值类型
 */
export type InfoFunc<T = any, R = void> = (info: OuputInfo<T>) => R;

/**
 * 输出函数类型，用于处理最终的日志输出
 * @template T 数据类型
 */
export type OutputFunc<T = any> = InfoFunc<T, void>;

/**
 * 适配器函数类型，根据日志类型返回对应的输出函数
 * @template T 数据类型
 * @param type 日志类型
 * @returns 输出函数或null/undefined
 */
export type AdapterFunc<T = any> = (type: string) => OutputFunc<T> | null | undefined;

/**
 * 输出适配器类型，可以是对象映射或适配器函数
 * @template T 数据类型
 */
export type OutputAdapter<T = any> = Record<string, OutputFunc<T>> | AdapterFunc<T>;

/**
 * Transform 函数的输入参数接口
 */
export interface TransformProps {
  /** 日志类型 */
  type: string;
  /** 原始消息数组 */
  messages: any[];
  /** 是否为嵌套调用，主调用为false，嵌套调用为true */
  isNestingCall: boolean;
}

/**
 * Logger 配置选项接口
 * @template T Transform 函数返回的数据类型
 * @template D Report 函数接收的数据类型，默认与T相同
 */
export interface LoggerOptions<T, D extends T = T> {
  /**
   * 数据转换函数，用于处理原始日志数据
   * @param options 包含日志类型、消息和嵌套标识的参数
   * @returns 转换后的数据或undefined
   */
  transform?: ((options: TransformProps) => T | undefined) | null;

  /**
   * 数据上报函数，用于处理转换后的数据
   * @param options 包含原始信息和转换后数据的参数
   */
  report?: ((options: TransformProps & { data: D }) => void) | null;

  /**
   * 最大嵌套深度，默认为3
   * 主调用不计入深度，嵌套调用从1开始计数
   */
  maxNestingDepth?: number;

  /**
   * 输出适配器数组，用于处理不同类型的日志输出
   * 可以是对象映射数组或适配器函数数组
   */
  outputAdapters?: OutputAdapter<T>[] | null;
}

/**
 * Logger 实例类型，支持动态属性访问
 * 任何属性都会返回一个日志函数
 */
export type Logger = Record<string, (...messages: any[]) => void>;

/**
 * 规范化类型工具，将所有属性变为必需且非空
 * @template T 需要规范化的类型
 */
export type Normalize<T extends Record<any, any>> = {
  [K in keyof T]-?: NonNullable<T[K]>;
};

/**
 * Logger 上下文接口，内部使用
 * @template T 数据类型
 */
export interface LoggerCtx<T> {
  /** 规范化后的配置选项 */
  options: Omit<Normalize<LoggerOptions<T>>, 'outputAdapters'> & {
    outputAdapters: AdapterFunc<T>[];
  };
}
