import { isNode } from '../utils';
import { defaultApplyColor } from './colors';
import type { NodeConsoleAdapterCtx, NodeConsoleAdapterOptions } from './types';

/**
 * 默认文本清理函数
 * @param text 待清理的文本
 * @returns 清理后的文本
 */
export function defaultTextCleaner(text: string): string {
  if (!text || typeof text.replace !== 'function') {
    return text;
  }
  return text
    .replace(/\[\s*\]/g, '') // 移除空的方括号
    .replace(/\s+/g, ' ') // 合并多个空格
    .trim(); // 移除首尾空格
}

/**
 * 规范化配置选项
 * @param options 用户配置选项
 * @returns 规范化后的配置选项
 */
export function normalizeOptions(options: NodeConsoleAdapterOptions): NodeConsoleAdapterCtx['options'] {
  return {
    enableColors: options.enableColors !== false,
    outputLevel: options.outputLevel || 'log',
    allowTypes: options.allowTypes || [],
    getLabel: options.getLabel || (() => ''),
    getMessages: options.getMessages || (() => null),
    customColors:
      options.customColors ||
      (() => {
        return {};
      }),
    customColorizer: options.customColorizer || defaultApplyColor,
    isEnvironmentValid: options.isEnvironmentValid || isNode,
    formatDate: options.formatDate || ((date) => date.toISOString()),
    format: options.format || '[%type][%label][%date] %message %othermessages',
    textCleaner: options.textCleaner || defaultTextCleaner,
  };
}
