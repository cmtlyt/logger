export interface OuputInfo<T = any> {
  type: string;
  messages: any[];
  transformData?: T;
}

export type OutputFunc<T = any> = (info: OuputInfo<T>) => void;

export type AdapterFunc<T = any> = (type: string) => OutputFunc<T> | null | undefined;

export type OutputAdapter<T = any> = Record<string, OutputFunc<T>> | AdapterFunc<T>;

export interface LoggerOptions<T, D extends T = T> {
  transform?: ((type: string, messages: any[]) => T) | null;
  report?: ((data: D) => void) | null;
  outputAdapters?: OutputAdapter<T>[] | null;
}

export type Logger = Record<string, (...messages: any[]) => void>;

export type Normalize<T extends Record<any, any>> = {
  [K in keyof T]-?: NonNullable<T[K]>;
};

export interface LoggerCtx<T> {
  options: Omit<Normalize<LoggerOptions<T>>, 'outputAdapters'> & {
    outputAdapters: AdapterFunc<T>[];
  };
}
