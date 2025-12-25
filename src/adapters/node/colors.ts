import { createRequire } from 'node:module';
import type { CustomColorizerOptions, ThemeColor } from './types';

const require = createRequire(import.meta.url);

/**
 * 尝试导入yoctocolors，如果不可用则返回null
 */
export const tryImportColors = (() => {
  let loaded = false;

  return () => {
    try {
      const colors = require('yoctocolors');
      return colors;
    } catch {
      if (!loaded) {
        console.warn(
          'yoctocolors is not available, fallback to plain text, you can customize the shader function through the customColorizer function, or add yoctocolors dependency',
        );
      }
      return null;
    } finally {
      loaded = true;
    }
  };
})();

/**
 * 默认颜色映射配置
 */
export const colorMap: Record<string, ThemeColor> = {
  error: { type: 'red', label: 'red', date: 'gray', message: 'white' },
  warn: { type: 'yellow', label: 'yellow', date: 'gray', message: 'white' },
  info: { type: 'blue', label: 'blue', date: 'gray', message: 'white' },
  debug: { type: 'magenta', label: 'magenta', date: 'gray', message: 'white' },
  success: { type: 'green', label: 'green', date: 'gray', message: 'white' },
};

/**
 * 获取默认颜色配置
 * @param type 日志类型
 * @returns 颜色配置对象
 */
export function getDefaultColors(type: string): ThemeColor {
  return colorMap[type] || { type: 'cyan', label: 'cyan', date: 'gray', message: 'white' };
}

/**
 * 默认着色器函数
 * @param options 着色器选项
 * @returns 着色后的文本
 */
export function defaultApplyColor(options: CustomColorizerOptions): string {
  const { text, colorName, colors, enableColors } = options;
  if (!(enableColors && colors)) {
    return text;
  }
  return colors[colorName]?.(text) || text;
}
