/** biome-ignore-all lint/style/useNamingConvention: example */
import { createLogger } from '../src';
import { webConsoleAdapter } from '../src/adapters/web';

const logger = createLogger({
  transform(type: string, messages: any[]) {
    const [point, params, ...otherMessages] = messages;

    return {
      type,
      point,
      params,
      messages: otherMessages,
    };
  },
  report({ type, point, params, messages }) {
    console.log(type, point, params, messages);
  },
  outputAdapters: [
    {
      log(info) {
        console.log('log,log', info);
      },
    },
    webConsoleAdapter({
      group: {
        enable: true,
        collapsed: false,
      },
      consoleLevel: 'log',
      getSubTitle: (info) => info.transformData.point,
      getMessages: (info) => [info.transformData.params, ...info.transformData.messages],
      customStyle: (info) => {
        info.baseStyle.fontSize = '8px';
        return info;
      },
    }),
  ],
});

logger.debug('test', 'debug');
logger.info('test', 'info');

import { createLogger as createLogger2 } from '@cmtlyt/logger';

const logger2 = createLogger2();

logger2.debug('test', 'debug');

const arr = [3, 4, 5];

const obj = {
  a: 1,
  b: 2,
  c: arr,
  d: {
    e: 6,
    f: arr,
  },
  f: '7',
  g: arr,
  h: () => {
    console.log('h');
  },
  i() {
    console.log('i');
  },
};

// @ts-expect-error
obj.obj = obj;

logger.debug(
  'test',
  'debug',
  obj,
  () => {
    console.log('h');
  },
  function a() {
    console.log('i');
  },
);
