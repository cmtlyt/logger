import { objectStringify } from '../utils';
import { getDefaultColors } from './colors';
import type { NodeConsoleAdapterCtx } from './types';

/**
 * 解析格式字符串并替换占位符
 * @param formatStr 格式字符串
 * @param type 日志类型
 * @param label 标签
 * @param messages 消息数组
 * @param ctx 适配器上下文
 * @returns 格式化后的字符串
 */
export function parseFormatString(
  formatStr: string,
  type: string,
  label: string,
  messages: any[],
  ctx: NodeConsoleAdapterCtx,
): string {
  const { options, colors } = ctx;
  const { formatDate, customColors, enableColors, customColorizer, textCleaner } = options;

  // 获取颜色配置
  const defaultColors = getDefaultColors(type);
  const colorConfig = customColors({ type }) || {};
  const finalColors = { ...defaultColors, ...colorConfig };

  // 分离主要消息和其他消息
  const mainMessage =
    messages.length > 0 ? (typeof messages[0] === 'string' ? messages[0] : objectStringify(messages[0])) : '';
  const otherMessages = messages
    .slice(1)
    .map((msg) => (typeof msg === 'string' ? msg : objectStringify(msg)))
    .join(' ');

  // 准备替换值，使用自定义着色器
  const replacements: Record<string, string> = {
    '%type': customColorizer({
      text: type.toUpperCase(),
      colorName: finalColors.type,
      colors,
      enableColors,
      part: 'type',
    }),
    '%label': label
      ? customColorizer({ text: label, colorName: finalColors.label, colors, enableColors, part: 'label' })
      : '',
    '%date': customColorizer({
      text: formatDate(new Date()),
      colorName: finalColors.date,
      colors,
      enableColors,
      part: 'date',
    }),
    '%message': customColorizer({
      text: mainMessage,
      colorName: finalColors.message,
      colors,
      enableColors,
      part: 'message',
    }),
    '%othermessages': otherMessages
      ? customColorizer({
          text: otherMessages,
          colorName: finalColors.message,
          colors,
          enableColors,
          part: 'othermessages',
        })
      : '',
  };

  const placeholders = Object.keys(replacements);

  // 替换占位符
  let result = formatStr;
  for (let i = 0; i < placeholders.length; i++) {
    const placeholder = placeholders[i];
    const value = replacements[placeholder];
    result = result.replaceAll(placeholder, value);
  }

  // 使用自定义文本清理函数
  result = textCleaner(result);

  return result;
}

/**
 * 格式化消息
 * @param type 日志类型
 * @param label 标签
 * @param messages 消息数组
 * @param ctx 适配器上下文
 * @returns 格式化后的消息字符串
 */
export function formatMessage(type: string, label: string, messages: any[], ctx: NodeConsoleAdapterCtx): string {
  const { options } = ctx;
  const { format } = options;

  return parseFormatString(format, type, label, messages, ctx);
}
