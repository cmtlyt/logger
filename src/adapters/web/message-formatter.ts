import { objectStringify } from '../utils';
import type { WebConsoleAdapterCtx } from './types';

function getSpace(fontSize: string, ctx: WebConsoleAdapterCtx) {
  const fs = Number.parseFloat(fontSize);
  let width = ctx.options.getWindowWidth();

  // 处理特殊数值：Infinity、-Infinity、NaN
  if (!Number.isFinite(width) || width <= 0) {
    width = 2048;
  }

  const spaceWidth = Math.min(1000, Math.floor((width / fs) * 1.12));
  return ' '.repeat(spaceWidth);
}

function getType(_v: any): string {
  return Object.prototype.toString.call(_v).slice(8, -1).toLowerCase();
}

const BASE_TYPE = new Set(['string', 'number', 'boolean', 'undefined', 'symbol', 'null', 'bigint']);

export function createContentMessage(messages: string[], fontSize: string, ctx: WebConsoleAdapterCtx) {
  const sliceMessages: any[] = [];
  const temp: any[] = [];

  for (let i = 0; i < messages.length; ++i) {
    const msg = messages[i];
    const msgType = getType(msg);
    if (BASE_TYPE.has(msgType)) {
      temp.push(String(msg));
    } else {
      sliceMessages.push(temp.join(' '), objectStringify(msg));
      temp.length = 0;
    }
  }
  sliceMessages.push(temp.join(' '));
  temp.length = 0;

  const space = getSpace(fontSize, ctx);

  return sliceMessages.flatMap((msg) => msg.split('\n')).join(space);
}
