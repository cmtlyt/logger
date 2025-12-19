import type { OuputInfo, OutputFunc } from '../../types';
import { defineAdapter, isWeb, objectStringify } from '../utils';

type Theme = { primary: string; tagColor: string; titleColor: string };

const THEME_MAP: Record<string, Theme> = {
  debug: { primary: '#eb2f96', tagColor: '#fff', titleColor: '#a7a7a7' },
  info: { primary: '#d9d9d9', tagColor: '#000', titleColor: '#a7a7a7' },
  warn: { primary: '#fa8c16', tagColor: '#fff', titleColor: '#a7a7a7' },
  error: { primary: '#f5222d', tagColor: '#fff', titleColor: '#a7a7a7' },
};

const BASE_STYLE_MAP = {
  borderRadiusSize: '6px',
  paddingBlock: '4px',
  paddingInline: '8px',
  lineWidth: '2px',
  fontSize: '10px',
};

function getSpace(fontSize: string) {
  const fs = Number.parseFloat(fontSize);
  const width = Math.floor((globalThis.window.outerWidth / fs) * 1.12);
  return ' '.repeat(width);
}

function getType(_v: any): string {
  return Object.prototype.toString.call(_v).slice(8, -1).toLowerCase();
}

function createContentMessage(messages: string[], fontSize: string) {
  const sliceMessages: any[] = [];
  const temp: any[] = [];
  const baseType = new Set(['string', 'number', 'boolean', 'undefined', 'symbol', 'null']);

  for (let i = 0; i < messages.length; ++i) {
    const msg = messages[i];
    const msgType = getType(msg);
    if (baseType.has(msgType)) {
      temp.push(String(msg));
    } else {
      sliceMessages.push(temp.join(' '), objectStringify(msg));
      temp.length = 0;
    }
  }
  sliceMessages.push(temp.join(' '));
  temp.length = 0;

  const space = getSpace(fontSize);

  return sliceMessages.flatMap((msg) => msg.split('\n')).join(space);
}

function asignStyle(theme: Theme, info: ReturnType<WebConsoleAdapterCtx['options']['customStyle']>) {
  return {
    theme: { ...theme, ...info.theme },
    baseStyle: { ...BASE_STYLE_MAP, ...info.baseStyle },
  };
}

function messageTransform(type: string, title: string, messages: any[], ctx: WebConsoleAdapterCtx) {
  const defaultTheme = THEME_MAP[type] || THEME_MAP.debug;

  const { group, customStyle } = ctx.options;

  const { theme, baseStyle } = asignStyle(
    defaultTheme,
    customStyle({ type, theme: { ...defaultTheme }, baseStyle: { ...BASE_STYLE_MAP } }),
  );

  const contentMessage = createContentMessage(messages, baseStyle.fontSize);

  const baseStyles = `margin-left:${group.enable ? '-16px' : '0'};padding:${baseStyle.paddingBlock} ${baseStyle.paddingInline};font-size:${baseStyle.fontSize};`;
  const hasTitle = title !== type;

  return {
    message: `%c${type}${hasTitle ? `%c(${title})` : ''}%c\n%c${contentMessage.padEnd(type.length, ' ')}`,
    styles: [
      `${baseStyles}background:${theme.primary};color:${theme.tagColor};border-radius:${baseStyle.borderRadiusSize} ${baseStyle.borderRadiusSize} 0 0;text-transform:uppercase;`,
      ...(hasTitle ? [`${baseStyles}margin-left:${baseStyle.lineWidth};color:${theme.titleColor};`] : []),
      'font-size:0;line-height:0;',
      `${baseStyles}display:inline-block;margin-top:-${baseStyle.lineWidth};background:#fff;border:${baseStyle.lineWidth} solid ${theme.primary};border-radius: 0 ${baseStyle.borderRadiusSize} ${baseStyle.borderRadiusSize};`,
    ],
  };
}

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

interface WebConsoleAdapterOptions {
  group?: {
    enable?: boolean;
    collapsed?: boolean;
  };
  consoleLevel?: 'debug' | 'info' | 'log' | 'warn';
  getSubTitle?: (info: OuputInfo) => string;
  getMessages?: (info: OuputInfo) => any[] | null;
  customStyle?: (info: { type: string; theme: Theme; baseStyle: typeof BASE_STYLE_MAP }) => {
    theme: Theme;
    baseStyle: typeof BASE_STYLE_MAP;
  };
}

interface WebConsoleAdapterCtx {
  options: {
    group: Required<NonNullable<WebConsoleAdapterOptions['group']>>;
    consoleLevel: NonNullable<WebConsoleAdapterOptions['consoleLevel']>;
    getSubTitle: (info: OuputInfo) => string;
    getMessages: (info: OuputInfo) => any[] | null;
    customStyle: (info: { type: string; theme: Theme; baseStyle: typeof BASE_STYLE_MAP }) => {
      theme: Theme;
      baseStyle: typeof BASE_STYLE_MAP;
    };
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
    getSubTitle: options.getSubTitle || (() => ''),
    getMessages: options.getMessages || (() => null),
    customStyle: options.customStyle || ((info) => info),
  };
}

export const webConsoleAdapter = defineAdapter((options?: WebConsoleAdapterOptions) => {
  const allowTypes = new Set(['debug', 'info', 'warn', 'error']);
  const ctx: WebConsoleAdapterCtx = { options: normalizeOptions(options || {}) };

  return (type) => {
    if (!isWeb()) {
      return null;
    }

    if (!allowTypes.has(type)) {
      return null;
    }

    return getAdapter(ctx);
  };
});
