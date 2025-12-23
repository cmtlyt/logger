import type { Theme } from './types';

export const THEME_MAP: Record<string, Theme> = {
  debug: { primary: '#eb2f96', tagColor: '#fff', titleColor: '#a7a7a7' },
  info: { primary: '#d9d9d9', tagColor: '#000', titleColor: '#a7a7a7' },
  warn: { primary: '#fa8c16', tagColor: '#fff', titleColor: '#a7a7a7' },
  error: { primary: '#f5222d', tagColor: '#fff', titleColor: '#a7a7a7' },
};

export const BASE_STYLE_MAP = {
  borderRadiusSize: '6px',
  paddingBlock: '4px',
  paddingInline: '8px',
  lineWidth: '2px',
  fontSize: '10px',
};
