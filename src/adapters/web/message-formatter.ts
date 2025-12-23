import { objectStringify } from '../utils';

function getSpace(fontSize: string) {
  const fs = Number.parseFloat(fontSize);
  const width = Math.floor((globalThis.window.outerWidth / fs) * 1.12);
  return ' '.repeat(width);
}

function getType(_v: any): string {
  return Object.prototype.toString.call(_v).slice(8, -1).toLowerCase();
}

export function createContentMessage(messages: string[], fontSize: string) {
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
