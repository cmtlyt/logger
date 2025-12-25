# @cmtlyt/logger

中文文档 | [English](./README.md)

## 介绍

`@cmtlyt/logger` 是一个现代化、轻量级的跨平台日志库，专注于美化控制台输出并提供灵活的扩展能力。它同时支持 **Node.js** 和 **Web** 环境，提供数据上报、自定义适配器、嵌套调用保护和输出控制等高级功能。

## 功能特性

- 🌍 **跨平台支持** - 在 Node.js 和 Web 环境中无缝工作
- 📊 **数据上报能力** - 支持自定义数据转换和上报机制
- 🔌 **插件化适配器** - 支持自定义输出适配器，灵活扩展
- 🎨 **美化输出** - 内置适配器提供美观的控制台样式，支持自定义主题
- 🛡️ **嵌套调用保护** - 先进的状态机机制防止栈溢出，支持可配置的深度限制
- 🎛️ **输出控制** - 通过 `enableOutput` 选项精细控制日志输出
- 📦 **轻量级** - 无外部依赖，体积小巧
- 🛠️ **TypeScript 支持** - 完整的类型定义支持，包含详细的 JSDoc 文档
- 🎯 **环境检测** - 自动环境检测和验证
- 🔄 **循环引用处理** - 安全处理日志对象中的循环引用
- 🎨 **丰富样式** - 支持颜色、渐变和自定义主题（Web 适配器）

## 安装

npm

```bash
npm i @cmtlyt/logger
```

yarn

```bash
yarn add @cmtlyt/logger
```

pnpm

```bash
pnpm add @cmtlyt/logger
```

## 快速开始

### 基础使用

```typescript
import { createLogger } from "@cmtlyt/logger";

const logger = createLogger();

// 输出不同级别的日志
logger.debug("这是一条调试信息");
logger.info("这是一条普通信息");
logger.warn("这是一条警告信息");
logger.error("这是一条错误信息");
```

### 使用 Web 适配器（浏览器）

```typescript
import { createLogger } from "@cmtlyt/logger";
import { webConsoleAdapter } from "@cmtlyt/logger/adapters/web";

const logger = createLogger({
  outputAdapters: [webConsoleAdapter()],
});

logger.info("这将使用美化样式输出");
```

### 使用 Node.js 适配器（服务端）

```typescript
import { createLogger } from "@cmtlyt/logger";
import { nodeConsoleAdapter } from "@cmtlyt/logger/adapters/node";

const logger = createLogger({
  outputAdapters: [nodeConsoleAdapter({
    enableColors: true,
    format: "[%type][%date] %message",
  })],
});

logger.info("这将在 Node.js 中使用彩色输出");
```

### 高级配置

```typescript
import { createLogger } from "@cmtlyt/logger";
import { webConsoleAdapter } from "@cmtlyt/logger/adapters/web";

const logger = createLogger({
  // 输出控制 - 可以是布尔值或函数
  enableOutput: ({ type }) => type !== 'debug' || process.env.NODE_ENV === 'development',

  // 最大嵌套深度，防止栈溢出
  maxNestingDepth: 3,

  // 数据转换函数
  transform({ type, messages, isNestingCall }) {
    const [point, params, ...otherMessages] = messages;
    return {
      type,
      point,
      params,
      messages: otherMessages,
      isNesting: isNestingCall,
      timestamp: Date.now(),
    };
  },

  // 数据上报函数
  report({ data }) {
    // 发送数据到分析服务
    if (data.type === 'error') {
      fetch('/api/error-tracking', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    }
  },

  // 输出适配器
  outputAdapters: [
    webConsoleAdapter({
      group: {
        enable: true,
        collapsed: false,
      },
      consoleLevel: "info",
      allowTypes: ['info', 'warn', 'error'], // 过滤日志类型
      getSubTitle: (info) => info.transformData?.point || "",
      getMessages: (info) => info.messages.slice(1),
      customStyle: (info) => {
        // 自定义主题颜色
        info.theme.primary = "#007bff";
        info.baseStyle.fontSize = "12px";
        return info;
      },
    }),
  ],
});

logger.info("user_login", { userId: 123 }, "用户登录", "额外信息");
```

## 核心功能

### 使用 enableOutput 进行输出控制

`enableOutput` 选项提供精细的日志输出控制，同时保留数据处理功能：

```typescript
const logger = createLogger({
  // 布尔值控制
  enableOutput: false, // 禁用所有输出但保留 transform/report

  // 函数控制实现动态行为
  enableOutput: ({ type, messages, data }) => {
    // 生产环境只输出错误
    if (process.env.NODE_ENV === 'production') {
      return type === 'error';
    }
    // 开发环境输出所有内容
    return true;
  },

  transform({ type, messages }) {
    return { type, messages, timestamp: Date.now() };
  },

  report({ data }) {
    // 即使 enableOutput 为 false，这里仍会执行
    sendToAnalytics(data);
  }
});
```

### 嵌套调用保护

日志器包含先进的栈溢出保护机制，通过精密的状态机实现。这可以防止在 transform/report 函数中调用日志函数时产生的无限递归：

```typescript
const logger = createLogger({
  maxNestingDepth: 3, // 允许的最大嵌套深度
  transform({ type, messages, isNestingCall }) {
    // 这可能会导致嵌套调用
    if (!isNestingCall) {
      logger.debug("转换函数被调用", type); // 嵌套级别 1
    }
    return { type, messages, isNesting: isNestingCall };
  },
  report({ data }) {
    // 这也可能导致嵌套调用
    if (!data.isNesting) {
      logger.info("上报数据", data); // 嵌套级别 2
    }
  }
});

// 日志器自动跟踪嵌套深度，丢弃超过最大深度的调用
// 以防止栈溢出
logger.info("这会触发转换和上报函数");
```

### 跨平台适配器

#### Web 适配器功能
- 使用 CSS 的美观控制台样式
- 支持渐变和自定义主题
- 分组和折叠功能
- 自定义窗口宽度检测

#### Node.js 适配器功能
- 通过 yoctocolors 支持颜色
- 可自定义的输出格式
- 文本清理和格式化
- 环境特定优化

### 自定义适配器

创建你自己的输出适配器：

```typescript
import { defineAdapter } from "@cmtlyt/logger/adapters";

const customAdapter = defineAdapter((options) => {
  return (type) => {
    // 返回 null 跳过此类型
    if (type === 'debug' && !options.enableDebug) {
      return null;
    }

    // 返回输出函数
    return (info) => {
      // 自定义输出逻辑
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [${type.toUpperCase()}]`, ...info.messages);
    };
  };
});

const logger = createLogger({
  outputAdapters: [customAdapter({ enableDebug: false })],
});
```

### 环境检测

两个适配器都会自动检测各自的运行环境：

```typescript
import { webConsoleAdapter, isWeb } from "@cmtlyt/logger/adapters/web";
import { nodeConsoleAdapter, isNode } from "@cmtlyt/logger/adapters/node";

// 手动环境检查
if (isWeb()) {
  console.log("运行在浏览器中");
}

if (isNode()) {
  console.log("运行在 Node.js 中");
}

// 适配器中的自动环境验证
const logger = createLogger({
  outputAdapters: [
    webConsoleAdapter({
      isEnvironmentValid: () => typeof window !== 'undefined',
    }),
    nodeConsoleAdapter({
      isEnvironmentValid: () => typeof process !== 'undefined',
    }),
  ],
});
```

## API 说明

### createLogger(options)

创建一个日志实例。

**参数:**

- `options.enableOutput` (Boolean|Function, 可选): 控制日志输出，默认 `true`
- `options.maxNestingDepth` (Number, 可选): 最大嵌套深度，默认 `3`
- `options.transform` (Function, 可选): 数据转换函数，接收 `({ type, messages, isNestingCall })` 参数
- `options.report` (Function, 可选): 数据上报函数，接收 `({ type, messages, isNestingCall, data })` 参数
- `options.outputAdapters` (Array, 可选): 输出适配器数组

**返回值:**

一个日志对象，包含不同级别的方法：`debug`、`info`、`warn`、`error` 等。

### webConsoleAdapter(options)

创建一个具有高级样式和配置选项的 Web 控制台适配器。

**参数:**

- `options.group` (Object, 可选): 分组配置
  - `enable` (Boolean): 是否启用分组，默认 `true`
  - `collapsed` (Boolean): 是否折叠分组，默认 `false`
- `options.consoleLevel` (String, 可选): 控制台输出级别，可选 `'debug'` | `'info'` | `'log'` | `'warn'`，默认 `'log'`
- `options.allowTypes` (Array|Set|Function, 可选): 允许的日志类型过滤器
- `options.getSubTitle` (Function, 可选): 获取子标题函数
- `options.getMessages` (Function, 可选): 获取消息函数
- `options.customStyle` (Function, 可选): 自定义样式和主题函数
- `options.getWindowWidth` (Function, 可选): 获取窗口宽度函数，用于布局
- `options.isEnvironmentValid` (Function, 可选): 环境验证函数

### nodeConsoleAdapter(options)

创建一个具有颜色支持和格式化选项的 Node.js 控制台适配器。

**参数:**

- `options.enableColors` (Boolean, 可选): 启用颜色输出，默认 `true`
- `options.outputLevel` (String, 可选): 控制台输出级别，可选 `'log'` | `'info'` | `'warn'` | `'error'`，默认 `'log'`
- `options.allowTypes` (Array|Set|Function, 可选): 允许的日志类型过滤器
- `options.format` (String, 可选): 带占位符的输出格式字符串
- `options.getLabel` (Function, 可选): 获取标签函数
- `options.getMessages` (Function, 可选): 获取消息函数
- `options.formatDate` (Function, 可选): 格式化日期函数
- `options.customColors` (Function, 可选): 自定义颜色函数
- `options.customColorizer` (Function, 可选): 自定义颜色应用函数
- `options.textCleaner` (Function, 可选): 清理格式化文本函数
- `options.isEnvironmentValid` (Function, 可选): 环境验证函数

### 工具函数

#### defineAdapter(callback)

创建类型安全适配器的辅助函数。

#### objectStringify(obj)

安全地序列化对象，支持函数和循环引用处理。

#### isWeb()

检测是否运行在 Web 浏览器环境中。

#### isNode()

检测是否运行在 Node.js 环境中。

## 使用示例

### 基础跨平台使用

```typescript
import { createLogger } from "@cmtlyt/logger";
import { webConsoleAdapter } from "@cmtlyt/logger/adapters/web";
import { nodeConsoleAdapter } from "@cmtlyt/logger/adapters/node";

const logger = createLogger({
  outputAdapters: [
    // 只在浏览器中工作
    webConsoleAdapter(),
    // 只在 Node.js 中工作
    nodeConsoleAdapter({ enableColors: true }),
  ],
});

logger.info("这在两个环境中都能工作！");
```

### 条件输出控制

```typescript
const logger = createLogger({
  enableOutput: ({ type, data }) => {
    // 生产环境只记录错误
    if (process.env.NODE_ENV === 'production') {
      return type === 'error';
    }
    
    // 开发环境记录所有内容
    return true;
  },
  
  transform({ type, messages }) {
    return {
      level: type,
      message: messages.join(' '),
      timestamp: Date.now(),
      environment: process.env.NODE_ENV
    };
  },
  
  report({ data }) {
    // 无论 enableOutput 如何，都会上报到分析服务
    if (data.level === 'error') {
      sendErrorToService(data);
    }
  }
});
```

### 高级 Node.js 格式化

```typescript
import { nodeConsoleAdapter } from "@cmtlyt/logger/adapters/node";

const logger = createLogger({
  outputAdapters: [
    nodeConsoleAdapter({
      format: "[%type][%label][%date] %message %othermessages",
      getLabel: (info) => `APP-${info.type.toUpperCase()}`,
      formatDate: (date) => date.toLocaleString('zh-CN'),
      customColors: ({ type }) => {
        const colorMap = {
          info: { type: 'cyan', message: 'white' },
          warn: { type: 'yellow', message: 'yellow' },
          error: { type: 'red', message: 'red' },
        };
        return colorMap[type] || {};
      },
      textCleaner: (text) => text.replace(/\s+/g, ' ').trim(),
    }),
  ],
});
```

### Web 渐变样式

```typescript
import { webConsoleAdapter } from "@cmtlyt/logger/adapters/web";

const logger = createLogger({
  outputAdapters: [
    webConsoleAdapter({
      customStyle: ({ type, theme, baseStyle }) => {
        if (type === 'info') {
          theme.primary = 'linear-gradient(45deg, #007bff, #0056b3)';
        } else if (type === 'error') {
          theme.primary = 'linear-gradient(45deg, #dc3545, #c82333)';
        }
        return { theme, baseStyle };
      },
    }),
  ],
});
```

查看 [示例文件](./example/) 了解更多全面的使用方式。

## 贡献

欢迎贡献代码！请随时提交 Pull Request。

## 许可证

MIT

## 更新日志

### v0.5.0
- 🌍 **跨平台支持** - 添加了功能完整的 Node.js 适配器
- 🎛️ **输出控制** - 新增 `enableOutput` 选项用于精细输出控制
- 🎨 **增强样式** - 改进渐变支持和自定义主题功能
- 🔧 **更好的 TypeScript** - 增强类型定义和 JSDoc 文档
- ⚡ **性能优化** - 优化嵌套调用处理和适配器选择
- 🐛 **错误修复** - 修复嵌套深度控制逻辑和循环引用处理

### v0.4.0
- 🛡️ 实现基于状态机的嵌套调用保护机制，防止栈溢出
- ⚡ 优化嵌套调用处理性能
- 🔧 增强TypeScript支持，添加完整的JSDoc文档注释
- 🐛 修复对象序列化中的循环引用处理

### v0.3.1
- 📚 初步JSDoc文档覆盖
- 🔧 基础TypeScript改进
- 🐛 小型bug修复
