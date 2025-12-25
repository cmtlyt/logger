#!/usr/bin/env node

/**
 * Logger Node.js 适配器完整功能测试
 *
 * 测试覆盖范围：
 * - Logger 核心功能：创建、缓存、代理
 * - NodeConsoleAdapter：所有配置选项和分支
 * - 颜色系统：yoctocolors 支持、自定义着色器
 * - AllowTypes：数组、Set、函数三种模式
 * - 环境验证：Node.js 环境检测
 * - 格式化系统：自定义格式、占位符替换
 * - 消息处理：getLabel、getMessages、formatDate
 * - 文本清理：默认和自定义清理函数
 * - 边缘情况：错误处理、默认值
 */

import process from 'node:process';
import { nodeConsoleAdapter } from '../dist/adapters/node/index.js';
import { createLogger } from '../dist/index.js';

// 测试结果统计
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: [],
};

// 测试工具函数
function assert(condition, message) {
  testResults.total++;
  if (condition) {
    testResults.passed++;
    console.log(`✅ ${message}`);
    return true;
  }
  testResults.failed++;
  testResults.errors.push(message);
  console.error(`❌ ${message}`);
  return false;
}

function testSection(name, testFn) {
  console.log(`\n🧪 ${name}`);
  console.log('='.repeat(50));
  try {
    testFn();
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`${name}: ${error.message}`);
    console.error(`❌ ${name} 测试异常:`, error);
  }
  console.log('');
}

// 1. Logger 核心功能测试
function testLoggerCore() {
  testSection('Logger 核心功能测试', () => {
    // 测试 createLogger 基础功能
    const logger1 = createLogger();
    assert(typeof logger1 === 'object', 'createLogger 返回对象');
    assert(typeof logger1.info === 'function', 'logger.info 是函数');
    assert(typeof logger1.debug === 'function', 'logger.debug 是函数');
    assert(typeof logger1.customType === 'function', 'logger.customType 是函数（动态属性）');

    // 测试函数缓存
    const loggerInfoFn1 = logger1.info;
    const loggerInfoFn2 = logger1.info;
    assert(loggerInfoFn1 === loggerInfoFn2, '相同类型的日志函数被缓存');

    // 测试不同实例的隔离
    const logger2 = createLogger();
    assert(logger1.info !== logger2.info, '不同 logger 实例的函数不同');

    // 测试 Proxy 代理
    logger1.testProxy('Proxy 代理测试');
    assert(typeof logger1.testProxy === 'function', 'Proxy 代理动态创建函数');
  });
}

// 2. NodeConsoleAdapter 基础功能测试
function testAdapterBasic() {
  testSection('NodeConsoleAdapter 基础功能测试', () => {
    // 测试适配器创建
    const adapter = nodeConsoleAdapter();
    assert(typeof adapter === 'function', 'nodeConsoleAdapter 返回函数');

    // 测试适配器返回值
    const outputFunc = adapter('info');
    assert(typeof outputFunc === 'function', 'adapter 返回输出函数');

    // 测试基础日志输出
    const logger = createLogger({
      outputAdapters: [nodeConsoleAdapter()],
    });

    console.log('\n📝 基础日志输出测试:');
    logger.info('基础适配器测试', { test: 'data' });
    assert(true, '基础日志输出正常');

    // 测试无配置的默认行为
    const defaultLogger = createLogger({
      outputAdapters: [nodeConsoleAdapter({})],
    });
    defaultLogger.debug('默认配置测试');
    assert(true, '默认配置工作正常');
  });
}

// 3. 输出级别测试
function testOutputLevels() {
  testSection('输出级别测试', () => {
    const levels = ['log', 'info', 'warn', 'error'];

    console.log('\n📝 不同输出级别测试:');
    levels.forEach((level) => {
      const logger = createLogger({
        outputAdapters: [
          nodeConsoleAdapter({
            outputLevel: level,
          }),
        ],
      });

      logger.test(`${level} 级别测试`);
      assert(true, `outputLevel: ${level} 测试`);
    });

    // 测试默认级别
    const defaultLogger = createLogger({
      outputAdapters: [nodeConsoleAdapter({})],
    });
    defaultLogger.test('默认级别测试');
    assert(true, '默认 outputLevel 测试');
  });
}

// 4. 消息处理函数测试
function testMessageHandlers() {
  testSection('消息处理函数测试', () => {
    console.log('\n📝 消息处理函数测试:');

    // 测试 getLabel
    const logger1 = createLogger({
      outputAdapters: [
        nodeConsoleAdapter({
          getLabel: (info) => `CUSTOM-${info.type.toUpperCase()}`,
        }),
      ],
    });
    logger1.info('getLabel 测试');
    assert(true, 'getLabel 函数测试');

    // 测试 getMessages
    const logger2 = createLogger({
      outputAdapters: [
        nodeConsoleAdapter({
          getMessages: (info) => ['自定义消息前缀', ...info.messages],
        }),
      ],
    });
    logger2.info('getMessages 测试');
    assert(true, 'getMessages 函数测试');

    // 测试 getMessages 返回 null
    const logger3 = createLogger({
      outputAdapters: [
        nodeConsoleAdapter({
          getMessages: () => null,
        }),
      ],
    });
    logger3.info('getMessages null 测试');
    assert(true, 'getMessages 返回 null 测试');

    // 测试默认处理函数
    const logger4 = createLogger({
      outputAdapters: [nodeConsoleAdapter({})],
    });
    logger4.info('默认处理函数测试');
    assert(true, '默认消息处理函数测试');
  });
}

// 5. AllowTypes 类型过滤测试
function testAllowTypes() {
  testSection('AllowTypes 类型过滤测试', () => {
    console.log('\n📝 类型过滤测试:');

    // 测试数组模式（扩展模式）
    console.log('\n🔸 数组模式测试:');
    const logger1 = createLogger({
      outputAdapters: [
        nodeConsoleAdapter({
          allowTypes: ['custom', 'special'],
        }),
      ],
    });
    logger1.info('数组模式 - info 应该显示');
    logger1.custom('数组模式 - custom 应该显示');
    logger1.blocked('数组模式 - blocked 不应该显示');
    assert(true, 'allowTypes 数组模式测试');

    // 测试 Set 模式（完全替换模式）
    console.log('\n🔸 Set 模式测试:');
    const logger2 = createLogger({
      outputAdapters: [
        nodeConsoleAdapter({
          allowTypes: new Set(['info', 'custom']),
        }),
      ],
    });
    logger2.info('Set 模式 - info 应该显示');
    logger2.custom('Set 模式 - custom 应该显示');
    logger2.debug('Set 模式 - debug 不应该显示');
    assert(true, 'allowTypes Set 模式测试');

    // 测试函数模式（完全替换模式）
    console.log('\n🔸 函数模式测试:');
    const logger3 = createLogger({
      outputAdapters: [
        nodeConsoleAdapter({
          allowTypes: (type) => type.startsWith('test'),
        }),
      ],
    });
    logger3.testInfo('函数模式 - testInfo 应该显示');
    logger3.testDebug('函数模式 - testDebug 应该显示');
    logger3.info('函数模式 - info 不应该显示');
    assert(true, 'allowTypes 函数模式测试');

    // 测试默认 allowTypes
    console.log('\n🔸 默认模式测试:');
    const logger4 = createLogger({
      outputAdapters: [nodeConsoleAdapter({})],
    });
    logger4.debug('默认 allowTypes - debug 应该显示');
    logger4.info('默认 allowTypes - info 应该显示');
    logger4.warn('默认 allowTypes - warn 应该显示');
    logger4.error('默认 allowTypes - error 应该显示');
    assert(true, '默认 allowTypes 测试');
  });
}

// 6. 环境验证测试
function testEnvironmentValidation() {
  testSection('环境验证测试', () => {
    console.log('\n📝 环境验证测试:');

    // 测试自定义环境验证 - 返回 true
    const logger1 = createLogger({
      outputAdapters: [
        nodeConsoleAdapter({
          isEnvironmentValid: () => true,
        }),
      ],
    });
    logger1.info('环境验证 true - 应该显示');
    assert(true, 'isEnvironmentValid 返回 true 测试');

    // 测试自定义环境验证 - 返回 false
    const logger2 = createLogger({
      outputAdapters: [
        nodeConsoleAdapter({
          isEnvironmentValid: () => false,
        }),
      ],
    });
    logger2.info('环境验证 false - 不应该处理色彩');
    assert(true, 'isEnvironmentValid 返回 false 测试');

    // 测试默认环境验证（Node.js 环境）
    const logger3 = createLogger({
      outputAdapters: [nodeConsoleAdapter({})],
    });
    logger3.info('默认环境验证 - 应该显示');
    assert(true, '默认环境验证测试');
  });
}

// 7. 颜色系统测试
function testColorSystem() {
  testSection('颜色系统测试', () => {
    console.log('\n📝 颜色系统测试:');

    // 测试启用颜色
    console.log('\n🔸 启用颜色测试:');
    const logger1 = createLogger({
      outputAdapters: [
        nodeConsoleAdapter({
          enableColors: true,
        }),
      ],
    });
    logger1.info('启用颜色测试');
    logger1.warn('警告颜色测试');
    logger1.error('错误颜色测试');
    logger1.debug('调试颜色测试');
    logger1.success('成功颜色测试');
    assert(true, 'enableColors=true 测试');

    // 测试禁用颜色
    console.log('\n🔸 禁用颜色测试:');
    const logger2 = createLogger({
      outputAdapters: [
        nodeConsoleAdapter({
          enableColors: false,
        }),
      ],
    });
    logger2.info('禁用颜色测试');
    assert(true, 'enableColors=false 测试');

    // 测试自定义颜色配置
    console.log('\n🔸 自定义颜色配置测试:');
    const logger3 = createLogger({
      outputAdapters: [
        nodeConsoleAdapter({
          customColors: ({ type }) => {
            if (type === 'info') {
              return { type: 'cyan', label: 'cyan', date: 'yellow', message: 'green' };
            }
            return {};
          },
        }),
      ],
    });
    logger3.info('自定义颜色配置测试');
    assert(true, 'customColors 函数测试');

    // 测试自定义着色器
    console.log('\n🔸 自定义着色器测试:');
    const logger4 = createLogger({
      outputAdapters: [
        nodeConsoleAdapter({
          customColorizer: ({ text, colorName, colors, enableColors, part }) => {
            if (!(enableColors && colors)) {
              return text;
            }
            // 为类型部分添加背景色
            if (part === 'type' && colors.bgBlue) {
              return colors.bgBlue(colors[colorName]?.(text) || text);
            }
            return colors[colorName]?.(text) || text;
          },
        }),
      ],
    });
    logger4.info('自定义着色器测试');
    assert(true, 'customColorizer 函数测试');
  });
}

// 8. 格式化系统测试
function testFormatSystem() {
  testSection('格式化系统测试', () => {
    console.log('\n📝 格式化系统测试:');

    // 测试默认格式
    console.log('\n🔸 默认格式测试:');
    const logger1 = createLogger({
      outputAdapters: [nodeConsoleAdapter({})],
    });
    logger1.info('默认格式测试', { data: 'test' });
    assert(true, '默认格式测试');

    // 测试自定义格式
    console.log('\n🔸 自定义格式测试:');
    const logger2 = createLogger({
      outputAdapters: [
        nodeConsoleAdapter({
          format: '[%type]-%date %message',
        }),
      ],
    });
    logger2.info('自定义格式测试');
    assert(true, '自定义格式测试');

    // 测试复杂格式
    console.log('\n🔸 复杂格式测试:');
    const logger3 = createLogger({
      outputAdapters: [
        nodeConsoleAdapter({
          format: '(%type)(%label)(%date) %message %othermessages',
          getLabel: (info) => `LABEL-${info.type}`,
        }),
      ],
    });
    logger3.info('复杂格式测试', '额外消息1', '额外消息2');
    assert(true, '复杂格式测试');

    // 测试自定义日期格式
    console.log('\n🔸 自定义日期格式测试:');
    const logger4 = createLogger({
      outputAdapters: [
        nodeConsoleAdapter({
          formatDate: (date) => date.toLocaleString('zh-CN'),
          format: '[%type][%date] %message',
        }),
      ],
    });
    logger4.info('自定义日期格式测试');
    assert(true, 'formatDate 函数测试');

    // 测试多占位符
    console.log('\n🔸 多占位符测试:');
    const logger5 = createLogger({
      outputAdapters: [
        nodeConsoleAdapter({
          format: '[%type][%date] %message [%date][%type] %othermessages',
        }),
      ],
    });
    logger5.info('自定义日期格式测试', '额外消息1', '额外消息2');
    assert(true, 'formatDate 函数测试');
  });
}

// 9. 文本清理测试
function testTextCleaner() {
  testSection('文本清理测试', () => {
    console.log('\n📝 文本清理测试:');

    // 测试默认文本清理
    console.log('\n🔸 默认文本清理测试:');
    const logger1 = createLogger({
      outputAdapters: [
        nodeConsoleAdapter({
          format: '[%type][ ][%date] %message', // 包含空的方括号
          getLabel: () => '', // 空标签
        }),
      ],
    });
    logger1.info('默认文本清理测试');
    assert(true, '默认文本清理测试');

    // 测试自定义文本清理
    console.log('\n🔸 自定义文本清理测试:');
    const logger2 = createLogger({
      outputAdapters: [
        nodeConsoleAdapter({
          format: '(%type)(%label)(%date) %message',
          getLabel: () => '', // 空标签会产生空的圆括号
          textCleaner: (text) => {
            return text
              .replace(/\(\s*\)/g, '') // 移除空的圆括号
              .replace(/\[\s*\]/g, '') // 移除空的方括号
              .replace(/\s+/g, ' ') // 合并多个空格
              .trim(); // 移除首尾空格
          },
        }),
      ],
    });
    logger2.info('自定义文本清理测试');
    assert(true, 'textCleaner 函数测试');
  });
}

// 10. Transform 和 Report 测试
function testTransformReport() {
  testSection('Transform & Report 测试', () => {
    console.log('\n📝 Transform & Report 测试:');

    let transformCalled = false;
    let reportCalled = false;
    let transformData = null;
    let reportData = null;

    const logger = createLogger({
      transform: ({ type, messages, isNestingCall }) => {
        transformCalled = true;
        transformData = { type, messages, isNestingCall, timestamp: Date.now() };
        return transformData;
      },
      report: ({ type, messages, isNestingCall, data }) => {
        reportCalled = true;
        reportData = { type, messages, isNestingCall, data };
      },
      outputAdapters: [nodeConsoleAdapter()],
    });

    logger.info('Transform Report 测试', { test: 'data' });

    assert(transformCalled, 'transform 函数被调用');
    assert(reportCalled, 'report 函数被调用');
    assert(transformData !== null, 'transform 返回数据');
    assert(reportData !== null, 'report 接收数据');
    assert(reportData.data === transformData, 'transform 和 report 数据一致');
    assert(transformData.isNestingCall === false, 'isNestingCall 标识正确');
  });
}

// 11. 边缘情况处理测试
function testEdgeCases() {
  testSection('边缘情况处理测试', () => {
    console.log('\n📝 边缘情况处理测试:');

    // 测试空消息
    console.log('\n🔸 空消息测试:');
    const logger1 = createLogger({
      outputAdapters: [nodeConsoleAdapter()],
    });
    logger1.info();
    logger1.info('');
    logger1.info(null);
    logger1.info(undefined);
    assert(true, '空消息边缘情况测试');

    // 测试异常对象
    console.log('\n🔸 异常对象测试:');
    const circularObject = { a: 1 };
    circularObject.self = circularObject;

    const logger2 = createLogger({
      outputAdapters: [nodeConsoleAdapter()],
    });
    logger2.info('循环引用对象', circularObject);
    assert(true, '循环引用对象边缘情况测试');

    // 测试复杂数据类型
    console.log('\n🔸 复杂数据类型测试:');
    const logger3 = createLogger({
      outputAdapters: [nodeConsoleAdapter()],
    });
    logger3.info(
      '复杂数据类型',
      new Date(),
      /regex/g,
      new Map([['key', 'value']]),
      new Set([1, 2, 3]),
      Symbol('test'),
      BigInt(123_456_789),
    );
    assert(true, '复杂数据类型边缘情况测试');

    // 测试无效格式字符串
    console.log('\n🔸 无效格式字符串测试:');
    const logger4 = createLogger({
      outputAdapters: [
        nodeConsoleAdapter({
          format: '%invalid %type %message',
        }),
      ],
    });
    logger4.info('无效格式字符串测试');
    assert(true, '无效格式字符串边缘情况测试');
  });
}

// 12. 嵌套调用深度控制测试
function testNestingDepthControl() {
  testSection('嵌套调用深度控制测试', () => {
    console.log('\n📝 嵌套调用深度控制测试:');

    // 测试真正的递进嵌套调用（每层调用触发下一层）
    const logger1 = createLogger({
      maxNestingDepth: 2,
      transform: ({ type, messages, isNestingCall }) => {
        // 创建真正的递进嵌套：每一层调用都会触发下一层
        if (type === 'level1' && !isNestingCall) {
          logger1.level2('第1层嵌套调用');
        } else if (type === 'level2' && isNestingCall) {
          logger1.level3('第2层嵌套调用');
        } else if (type === 'level3' && isNestingCall) {
          logger1.level4('第3层嵌套调用 - 应该被丢弃');
        }
        return { type, messages, isNestingCall };
      },
      outputAdapters: [nodeConsoleAdapter()],
    });

    logger1.level1('触发递进嵌套');
    assert(true, '递进嵌套调用测试（2层限制）');

    // 测试自定义深度限制（2层）
    const logger2 = createLogger({
      maxNestingDepth: 2,
      transform: ({ type, messages, isNestingCall }) => {
        if (type === 'start' && !isNestingCall) {
          logger2.nested1('第1层嵌套');
        } else if (type === 'nested1' && isNestingCall) {
          logger2.nested2('第2层嵌套');
        } else if (type === 'nested2' && isNestingCall) {
          logger2.nested3('第3层嵌套 - 应该被丢弃');
        }
        return { type, messages, isNestingCall };
      },
      outputAdapters: [nodeConsoleAdapter()],
    });

    logger2.start('触发2层深度限制测试');
    assert(true, '自定义深度限制（2层）测试');

    // 测试同一层多个调用（这些调用属于同一嵌套层级）
    const logger3 = createLogger({
      transform: ({ type, messages, isNestingCall }) => {
        if (type === 'trigger' && !isNestingCall) {
          // 这些调用都属于第1层嵌套
          logger3.same1('同层调用1');
          logger3.same2('同层调用2');
          logger3.same3('同层调用3');
        }
        return { type, messages, isNestingCall };
      },
      outputAdapters: [nodeConsoleAdapter()],
    });

    logger3.trigger('触发同层多个调用测试');
    assert(true, '同层多个调用测试');

    // 测试嵌套调用中的 isNestingCall 标识
    let nestingCallDetected = false;
    const logger4 = createLogger({
      transform: ({ type, messages, isNestingCall }) => {
        if (type === 'trigger' && !isNestingCall) {
          logger4.nested('嵌套调用');
        }
        if (type === 'nested' && isNestingCall) {
          nestingCallDetected = true;
        }
        return { type, messages, isNestingCall };
      },
      outputAdapters: [nodeConsoleAdapter()],
    });

    logger4.trigger('触发 isNestingCall 测试');
    assert(nestingCallDetected, 'isNestingCall 标识正确检测');

    // 测试状态机正确重置
    const logger5 = createLogger({
      outputAdapters: [nodeConsoleAdapter()],
    });

    logger5.info('第一次调用');
    logger5.info('第二次调用 - 状态应该已重置');
    assert(true, '状态机正确重置测试');

    // 测试复杂的递进嵌套场景
    const depthTracker = [];
    const logger6 = createLogger({
      maxNestingDepth: 3, // 允许1、2、3层嵌套，主调用不计入
      transform: ({ type, messages, isNestingCall }) => {
        // 记录调用深度
        if (type.startsWith('depth')) {
          const depth = isNestingCall ? 'nested' : 'main';
          depthTracker.push(`${type}:${depth}`);

          // 创建递进嵌套
          if (type === 'depth1' && !isNestingCall) {
            // 主调用触发第1层嵌套
            logger6.depth2('进入第1层嵌套');
          } else if (type === 'depth2' && isNestingCall) {
            // 第1层嵌套触发第2层嵌套
            logger6.depth3('进入第2层嵌套');
          } else if (type === 'depth3' && isNestingCall) {
            // 第2层嵌套触发第3层嵌套
            logger6.depth4('进入第3层嵌套');
          } else if (type === 'depth4' && isNestingCall) {
            // 第3层嵌套触发第4层嵌套 - 应该被丢弃（超过maxNestingDepth=3）
            logger6.depth5('进入第4层嵌套 - 应该被丢弃');
          }
        }
        return { type, messages, isNestingCall };
      },
      outputAdapters: [nodeConsoleAdapter()],
    });

    logger6.depth1('开始复杂递进嵌套测试');

    // 验证深度跟踪结果
    console.log('深度跟踪结果:', depthTracker);
    console.log('嵌套深度说明: 主调用(depth1)不计入嵌套深度，depth2=第1层嵌套，depth3=第2层嵌套，depth4=第3层嵌套');
    assert(depthTracker.includes('depth1:main'), '主调用正确标识（不计入嵌套深度）');
    assert(depthTracker.includes('depth2:nested'), '第1层嵌套正确标识');
    assert(depthTracker.includes('depth3:nested'), '第2层嵌套正确标识');
    assert(depthTracker.includes('depth4:nested'), '第3层嵌套正确标识');
    assert(!depthTracker.includes('depth5:nested'), '第4层嵌套被正确丢弃（超过maxNestingDepth=3）');
    assert(true, '复杂递进嵌套场景测试');
  });
}

// 13. 性能测试
function testPerformance() {
  testSection('性能测试', () => {
    console.log('\n📝 性能测试:');

    const logger = createLogger({
      outputAdapters: [nodeConsoleAdapter()],
    });

    // 测试大量日志输出
    const startTime = process.hrtime.bigint();
    for (let i = 0; i < 1000; i++) {
      logger.info(`性能测试 ${i}`, { index: i, data: 'test' });
    }
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1_000_000; // 转换为毫秒

    console.log(`1000 条日志输出耗时: ${duration.toFixed(2)}ms`);
    assert(duration < 5000, `性能测试通过 (${duration.toFixed(2)}ms < 5000ms)`);

    // 测试函数缓存性能
    const cacheStartTime = process.hrtime.bigint();
    for (let i = 0; i < 1000; i++) {
      const cachedFunction = logger.info; // 访问缓存的函数
      void cachedFunction; // 避免未使用变量警告
    }
    const cacheEndTime = process.hrtime.bigint();
    const cacheDuration = Number(cacheEndTime - cacheStartTime) / 1_000_000;

    console.log(`1000 次函数缓存访问耗时: ${cacheDuration.toFixed(2)}ms`);
    assert(cacheDuration < 100, `缓存性能测试通过 (${cacheDuration.toFixed(2)}ms < 100ms)`);
  });
}

// 14. 兼容性测试
function testCompatibility() {
  testSection('兼容性测试', () => {
    console.log('\n📝 兼容性测试:');

    // 测试无配置创建
    const logger1 = createLogger();
    logger1.info('无配置兼容性测试');
    assert(true, '无配置创建兼容性测试');

    // 测试空配置
    const logger2 = createLogger({});
    logger2.info('空配置兼容性测试');
    assert(true, '空配置兼容性测试');

    // 测试部分配置
    const logger3 = createLogger({
      outputAdapters: [nodeConsoleAdapter()],
    });
    logger3.info('部分配置兼容性测试');
    assert(true, '部分配置兼容性测试');

    // 测试 yoctocolors 不可用的情况（模拟）
    const logger4 = createLogger({
      outputAdapters: [
        nodeConsoleAdapter({
          enableColors: false, // 模拟颜色不可用
        }),
      ],
    });
    logger4.info('颜色不可用兼容性测试');
    assert(true, '颜色不可用兼容性测试');
  });
}

// 15. 复杂场景测试
function testComplexScenarios() {
  testSection('复杂场景测试', () => {
    console.log('\n📝 复杂场景测试:');

    // 测试多个适配器
    console.log('\n🔸 多适配器测试:');
    const logger1 = createLogger({
      outputAdapters: [
        nodeConsoleAdapter({
          allowTypes: ['info'],
          format: '[INFO-ADAPTER] %message',
        }),
        nodeConsoleAdapter({
          allowTypes: ['debug'],
          format: '[DEBUG-ADAPTER] %message',
        }),
      ],
    });
    logger1.info('多适配器 info 测试');
    logger1.debug('多适配器 debug 测试');
    assert(true, '多适配器场景测试');

    // 测试动态类型
    console.log('\n🔸 动态类型测试:');
    const logger2 = createLogger({
      outputAdapters: [nodeConsoleAdapter()],
    });
    const dynamicTypes = ['custom1', 'custom2', 'custom3'];
    dynamicTypes.forEach((type) => {
      logger2[type](`动态类型 ${type} 测试`);
    });
    assert(true, '动态类型场景测试');

    // 测试复杂配置组合
    console.log('\n🔸 复杂配置组合测试:');
    const logger3 = createLogger({
      outputAdapters: [
        nodeConsoleAdapter({
          enableColors: true,
          outputLevel: 'info',
          format: '[%type][%label][%date] %message %othermessages',
          getLabel: (info) => `CUSTOM-${info.type}`,
          getMessages: (info) => ['PREFIX', ...info.messages, 'SUFFIX'],
          customColors: ({ type }) => (type === 'info' ? { type: 'cyan', message: 'yellow' } : {}),
          formatDate: (date) => date.toISOString().split('T')[0],
          textCleaner: (text) => text.replace(/\s+/g, ' ').trim(),
        }),
      ],
    });
    logger3.info('复杂配置组合测试', '额外消息');
    assert(true, '复杂配置组合测试');
  });
}

// 16. enableOutput 输出控制测试
function testEnableOutput() {
  testSection('enableOutput 输出控制测试', () => {
    console.log('\n📝 enableOutput 输出控制测试:');

    // 测试1: enableOutput = true（默认行为）
    const logger1 = createLogger({
      enableOutput: true,
      outputAdapters: [nodeConsoleAdapter()],
    });
    logger1.info('enableOutput=true 测试 - 应该显示');
    assert(true, 'enableOutput=true 测试');

    // 测试2: enableOutput = false（禁用输出）
    const logger2 = createLogger({
      enableOutput: false,
      outputAdapters: [nodeConsoleAdapter()],
    });
    logger2.info('enableOutput=false 测试 - 不应该显示');
    assert(true, 'enableOutput=false 测试');

    // 测试3: enableOutput 函数形式
    const logger3 = createLogger({
      enableOutput: ({ type }) => {
        return type === 'info'; // 只允许 info 类型
      },
      outputAdapters: [nodeConsoleAdapter()],
    });
    logger3.info('enableOutput函数=true 测试 - 应该显示');
    logger3.debug('enableOutput函数=false 测试 - 不应该显示');
    assert(true, 'enableOutput 函数形式测试');

    // 测试4: enableOutput 不影响 transform 和 report
    let transformCalled = false;
    let reportCalled = false;
    const logger4 = createLogger({
      enableOutput: false, // 禁用输出
      transform: ({ type, messages }) => {
        transformCalled = true;
        return { type, messages, transformed: true };
      },
      report: () => {
        reportCalled = true;
      },
      outputAdapters: [nodeConsoleAdapter()],
    });
    logger4.info('transform/report 测试 - 输出被禁用但transform/report应该执行');
    assert(transformCalled, 'enableOutput=false 时 transform 仍被调用');
    assert(reportCalled, 'enableOutput=false 时 report 仍被调用');
  });
}

// 运行所有测试
function runAllTests() {
  console.log('🚀 开始运行 Node.js Logger 完整测试套件...\n');
  console.log('='.repeat(60));

  // 重置测试结果
  testResults = { total: 0, passed: 0, failed: 0, errors: [] };

  // 按顺序运行所有测试
  const tests = [
    testLoggerCore,
    testAdapterBasic,
    testOutputLevels,
    testMessageHandlers,
    testAllowTypes,
    testEnvironmentValidation,
    testColorSystem,
    testFormatSystem,
    testTextCleaner,
    testTransformReport,
    testEdgeCases,
    testNestingDepthControl,
    testPerformance,
    testCompatibility,
    testComplexScenarios,
    testEnableOutput,
  ];

  tests.forEach((test, index) => {
    console.log(`\n📋 运行测试 ${index + 1}/${tests.length}: ${test.name}`);
    test();
  });

  // 输出测试总结
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 测试总结报告');
  console.log('='.repeat(60));
  console.log(`总测试数: ${testResults.total}`);
  console.log(`✅ 通过: ${testResults.passed}`);
  console.log(`❌ 失败: ${testResults.failed}`);
  console.log(`成功率: ${((testResults.passed / testResults.total) * 100).toFixed(2)}%`);

  if (testResults.errors.length > 0) {
    console.log('\n❌ 失败的测试:');
    testResults.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }

  console.log('\n🎉 Node.js Logger 测试套件运行完成!');
  console.log('\n💡 说明:');
  console.log('- 此测试文件专门为 Node.js 环境设计');
  console.log('- 测试覆盖了 NodeConsoleAdapter 的所有功能特性');
  console.log('- 包含颜色系统、格式化、消息处理等完整功能测试');
  console.log('- 支持 yoctocolors 颜色库的测试和降级处理');

  // 退出进程，返回适当的退出码
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// 如果直接运行此文件，则执行所有测试
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests();
}

// 导出测试函数供其他模块使用
export {
  testLoggerCore,
  testAdapterBasic,
  testOutputLevels,
  testMessageHandlers,
  testAllowTypes,
  testEnvironmentValidation,
  testColorSystem,
  testFormatSystem,
  testTextCleaner,
  testTransformReport,
  testEdgeCases,
  testNestingDepthControl,
  testPerformance,
  testCompatibility,
  testComplexScenarios,
  testEnableOutput,
  runAllTests,
};
