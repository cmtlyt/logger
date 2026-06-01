import type { OutputAdapter, OutputFunc } from '@/types';
import { createAllowTypesChecker, defineAdapter, isTypeAllowed } from '../utils';
import { tryImportColors } from './colors';
import { formatMessage } from './formatter';
import { normalizeOptions } from './node-utils';
import type { NodeConsoleAdapterCtx, NodeConsoleAdapterOptions } from './types';

/**
 * 创建适配器实例
 * @param ctx 适配器上下文
 * @returns 输出函数
 */
function getAdapter(ctx: NodeConsoleAdapterCtx): OutputFunc {
  const { outputLevel, getLabel, getMessages } = ctx.options;

  return (info) => {
    const { type, messages } = info;
    const label = getLabel(info) || '';
    const userMessages = getMessages(info) || messages;

    // 过滤掉包含module的对象，只保留实际的消息内容
    const filteredMessages = userMessages.filter((msg) => {
      if (typeof msg === 'object' && msg !== null && 'module' in msg) {
        return false; // 过滤掉module对象
      }
      return true;
    });

    const formattedMessage = formatMessage(type, label, filteredMessages, ctx);

    console[outputLevel](formattedMessage);
  };
}

/**
 * Node.js控制台适配器，用于在Node.js环境中输出格式化的日志信息
 *
 * 支持的功能：
 * - 彩色输出（基于yoctocolors）
 * - 自定义输出格式：[type][label][date] message
 * - 多种输出级别
 * - 类型过滤和环境检测
 * - 自定义消息格式化
 *
 * @template T 数据类型
 * @param options 配置选项，可选
 * @returns 适配器函数
 *
 * @example
 * ```typescript
 * // 基础用法
 * const adapter = nodeConsoleAdapter();
 *
 * // 自定义配置
 * const adapter = nodeConsoleAdapter({
 *   enableColors: true,
 *   outputLevel: 'info',
 *   allowTypes: ['info', 'warn', 'error'],
 *   format: '[%type]-%date %message'
 * });
 *
 * // 使用自定义着色器
 * const adapter = nodeConsoleAdapter({
 *   customColorizer: ({ text, colorName, colors, enableColors, part }) => {
 *     if (!enableColors || !colors) return text;
 *     // 自定义着色逻辑，例如根据part类型添加不同的背景色
 *     if (part === 'type') {
 *       return colors.bgBlue?.(colors[colorName]?.(text)) || text;
 *     }
 *     return colors[colorName]?.(text) || text;
 *   },
 *   format: '[%type] %message'
 * });
 *
 * // 使用自定义文本清理器
 * const adapter = nodeConsoleAdapter({
 *   format: '(%type)(%label)(%date) %message',
 *   textCleaner: (text) => {
 *     return text
 *       .replace(/\(\s*\)/g, '') // 移除空的圆括号
 *       .replace(/\[\s*\]/g, '') // 移除空的方括号
 *       .replace(/\s+/g, ' ')    // 合并多个空格
 *       .trim();                 // 移除首尾空格
 *   }
 * });
 * ```
 */
export const nodeConsoleAdapter = defineAdapter(
  async <T>(options?: NodeConsoleAdapterOptions<T>): Promise<OutputAdapter<T>> => {
    const colors = typeof options?.customColorizer === 'function' ? null : await tryImportColors();
    const ctx: NodeConsoleAdapterCtx = {
      options: normalizeOptions(options || {}),
      colors,
    };

    // 如果yoctocolors不可用，禁用颜色
    if (!colors && ctx.options.enableColors) {
      ctx.options.enableColors = false;
    }

    const allowTypesChecker = createAllowTypesChecker(ctx.options.allowTypes);
    const environmentValid = ctx.options.isEnvironmentValid();

    if (!environmentValid) {
      return {};
    }

    return (type) => {
      if (!isTypeAllowed(type, allowTypesChecker)) {
        return null;
      }

      return getAdapter(ctx);
    };
  },
);

export type { NodeConsoleAdapterOptions } from './types';
