import type { OutputFunc } from '@/types';
import { defineAdapter, isWeb } from '../utils';
import { createAllowTypesChecker, isTypeAllowed } from './allow-types-checker';
import { messageTransform } from './style-utils';
import type { WebConsoleAdapterCtx, WebConsoleAdapterOptions } from './types';

function getAdapter(ctx: WebConsoleAdapterCtx): OutputFunc {
  const { group: groupInfo, consoleLevel, getSubTitle, getMessages } = ctx.options;

  return (info) => {
    const { type, messages } = info;
    const title = getSubTitle(info) || type;
    const userMessages = getMessages(info) || messages;
    const messageInfo = messageTransform(type, title, userMessages, ctx);

    if (groupInfo.enable) {
      console[groupInfo.collapsed ? 'groupCollapsed' : 'group'](title);
      console[consoleLevel](messageInfo.message, ...messageInfo.styles);
      console.groupEnd();
    } else {
      console[consoleLevel](messageInfo.message, ...messageInfo.styles);
    }
  };
}

function normalizeOptions(options: WebConsoleAdapterOptions): WebConsoleAdapterCtx['options'] {
  const group = options.group || {};
  return {
    group: {
      enable: group.enable !== false,
      collapsed: group.collapsed !== false,
    },
    consoleLevel: options.consoleLevel || 'log',
    allowTypes: options.allowTypes || [],
    getSubTitle: options.getSubTitle || (() => ''),
    getMessages: options.getMessages || (() => null),
    customStyle: options.customStyle || ((info) => info),
    isEnvironmentValid: options.isEnvironmentValid || isWeb,
  };
}

/**
 * Web控制台适配器，用于在浏览器控制台中输出格式化的日志信息
 *
 * 支持的功能：
 * - 彩色主题和样式自定义
 * - 分组显示和折叠控制
 * - 多种控制台输出级别
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
 * const adapter = webConsoleAdapter();
 *
 * // 自定义配置
 * const adapter = webConsoleAdapter({
 *   group: { enable: true, collapsed: false },
 *   consoleLevel: 'info',
 *   allowTypes: ['info', 'warn', 'error']
 * });
 * ```
 */
export const webConsoleAdapter = defineAdapter(<T>(options?: WebConsoleAdapterOptions<T>) => {
  const ctx: WebConsoleAdapterCtx = { options: normalizeOptions(options || {}) };
  const allowTypesChecker = createAllowTypesChecker(ctx.options.allowTypes);
  const environmentValidator = ctx.options.isEnvironmentValid;

  return (type) => {
    if (!environmentValidator()) {
      return null;
    }

    if (!isTypeAllowed(type, allowTypesChecker)) {
      return null;
    }

    return getAdapter(ctx);
  };
});

export type { WebConsoleAdapterOptions } from './types';
