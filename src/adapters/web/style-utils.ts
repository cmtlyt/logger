import { BASE_STYLE_MAP, THEME_MAP } from './constants';
import { createContentMessage } from './message-formatter';
import type { Theme, WebConsoleAdapterCtx } from './types';

/**
 * 从渐变或纯色中提取适合边框的颜色
 * 如果是渐变, 提取第一个颜色作为边框色；如果是纯色, 直接使用
 * 支持多种颜色格式：#rgb, #rrggbb, #rrggbbaa, rgb(), rgba(), hsl(), hsla()
 */
function extractBorderColor(color: string): string {
  // 检查是否是渐变
  if (color.includes('gradient')) {
    // 提取渐变中的第一个颜色, 支持多种格式
    const colorPatterns = [
      /#[0-9a-fA-F]{8}/, // #rrggbbaa (8位)
      /#[0-9a-fA-F]{6}/, // #rrggbb (6位)
      /#[0-9a-fA-F]{4}/, // #rgba (4位)
      /#[0-9a-fA-F]{3}/, // #rgb (3位)
      /rgba?\([^)]+\)/, // rgb() 或 rgba()
      /hsla?\([^)]+\)/, // hsl() 或 hsla()
    ];

    for (let i = 0; i < colorPatterns.length; i++) {
      const match = color.match(colorPatterns[i]);
      if (match) {
        return match[0];
      }
    }

    // 如果都没匹配到, 使用默认颜色
    return '#d9d9d9';
  }

  // 如果是纯色, 直接返回
  return color;
}

export function mergeStyle(theme: Theme, info: ReturnType<WebConsoleAdapterCtx['options']['customStyle']>) {
  return {
    theme: { ...theme, ...info.theme },
    baseStyle: { ...BASE_STYLE_MAP, ...info.baseStyle },
  };
}

export function messageTransform(type: string, title: string, messages: any[], ctx: WebConsoleAdapterCtx) {
  const defaultTheme = THEME_MAP[type] || THEME_MAP.debug;

  const { group, customStyle } = ctx.options;

  const { theme, baseStyle } = mergeStyle(
    defaultTheme,
    customStyle({ type, theme: { ...defaultTheme }, baseStyle: { ...BASE_STYLE_MAP } }),
  );

  const contentMessage = createContentMessage(messages, baseStyle.fontSize);

  const baseStyles = `margin-left:${group.enable ? '-16px' : '0'};padding:${baseStyle.paddingBlock} ${baseStyle.paddingInline};font-size:${baseStyle.fontSize};`;
  const hasTitle = title !== type && !group.enable;

  // 提取适合边框的颜色（处理渐变情况）
  const borderColor = extractBorderColor(theme.primary);

  return {
    message: `%c${type}${hasTitle ? `%c(${title})` : ''}%c\n%c${contentMessage.padEnd(type.length, ' ')}`,
    styles: [
      `${baseStyles}background:${theme.primary};color:${theme.tagColor};border-radius:${baseStyle.borderRadiusSize} ${baseStyle.borderRadiusSize} 0 0;text-transform:uppercase;`,
      ...(hasTitle
        ? [`${baseStyles}margin-left:${baseStyle.lineWidth};padding-inline:0;color:${theme.titleColor};`]
        : []),
      'font-size:0;line-height:0;',
      `${baseStyles}display:inline-block;margin-top:-${baseStyle.lineWidth};background:#fff;border:${baseStyle.lineWidth} solid ${borderColor};border-radius: 0 ${baseStyle.borderRadiusSize} ${baseStyle.borderRadiusSize};`,
    ],
  };
}
