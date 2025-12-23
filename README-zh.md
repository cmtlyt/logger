# @cmtlyt/logger

中文文档 | [English](./README.md)

## 介绍

`@cmtlyt/logger` 是一个现代化、轻量级的浏览器日志库，专注于美化控制台输出并提供灵活的扩展能力。它不仅能够美化日志展示，还支持埋点上报、自定义适配器，以及嵌套调用保护和代码混淆等高级功能。

## 功能特性

- 📊 **埋点上报能力** - 支持自定义数据转换和上报机制
- 🔌 **插件化适配器** - 支持自定义输出适配器，灵活扩展
- 🎨 **Web 适配器美化输出** - 内置适配器提供美观的浏览器控制台样式，支持自定义主题
- 🛡️ **嵌套调用保护** - 先进的状态机机制防止栈溢出，支持可配置的深度限制
- 🔒 **代码混淆支持** - 内置生产环境代码混淆支持
- 📦 **轻量级** - 无外部依赖，体积小巧
- 🛠️ **TypeScript 支持** - 完整的类型定义支持，包含详细的 JSDoc 文档
- 🎯 **环境检测** - 自动环境检测和验证
- 🔄 **循环引用处理** - 安全处理日志对象中的循环引用

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

### 使用 Web 适配器

```typescript
import { createLogger } from "@cmtlyt/logger";
import { webConsoleAdapter } from "@cmtlyt/logger/adapters/web";

const logger = createLogger({
  outputAdapters: [webConsoleAdapter()],
});

logger.info("这将使用美化样式输出");
```

### 高级配置

```typescript
import { createLogger } from "@cmtlyt/logger";
import { webConsoleAdapter } from "@cmtlyt/logger/adapters/web";

const logger = createLogger({
  // 最大嵌套深度，防止栈溢出
  maxNestingDepth: 3,

  // 数据转换函数
  transform({ type, messages }) {
    const [point, params, ...otherMessages] = messages;
    return {
      type,
      point,
      params,
      messages: otherMessages,
    };
  },

  // 数据上报函数
  report({ data }) {
    // 发送数据到埋点服务
    console.log("上报数据:", data);
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

### 嵌套调用保护

日志器包含先进的栈溢出保护机制，通过精密的状态机实现。这可以防止在 transform/report 函数中调用日志函数时产生的无限递归：

```typescript
const logger = createLogger({
  maxNestingDepth: 3, // 允许的最大嵌套深度
  transform({ type, messages }) {
    // 这可能会导致嵌套调用
    logger.debug("转换函数被调用", type); // 嵌套级别 1
    return { type, messages };
  },
  report({ data }) {
    // 这也可能导致嵌套调用
    logger.info("上报数据", data); // 嵌套级别 2
  }
});

// 日志器自动跟踪嵌套深度，丢弃超过最大深度的调用
// 以防止栈溢出
logger.info("这会触发转换和上报函数");
```

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
      console.log(`[${type.toUpperCase()}]`, ...info.messages);
    };
  };
});

const logger = createLogger({
  outputAdapters: [customAdapter({ enableDebug: false })],
});
```

### 环境检测

Web 适配器自动检测运行环境：

```typescript
import { webConsoleAdapter, isWeb } from "@cmtlyt/logger/adapters/web";

// 手动环境检查
if (isWeb()) {
  console.log("运行在浏览器中");
}

// 适配器中的自动环境验证
const logger = createLogger({
  outputAdapters: [
    webConsoleAdapter({
      isEnvironmentValid: () => typeof window !== 'undefined',
    }),
  ],
});
```

## API 说明

### createLogger(options)

创建一个日志实例。

**参数:**

- `options.maxNestingDepth` (Number, 可选): 最大嵌套深度，默认 `3`
- `options.transform` (Function, 可选): 数据转换函数，接收 `({ type, messages })` 参数
- `options.report` (Function, 可选): 数据上报函数，接收 `({ data })` 参数
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
- `options.isEnvironmentValid` (Function, 可选): 环境验证函数

### 工具函数

#### defineAdapter(callback)

创建类型安全适配器的辅助函数。

#### objectStringify(obj)

安全地序列化对象，支持函数和循环引用处理。

#### isWeb()

检测是否运行在 Web 浏览器环境中。

## 使用示例

### 基础日志记录

```typescript
import { createLogger } from "@cmtlyt/logger";

const logger = createLogger();

logger.debug("调试信息");
logger.info("一般信息");
logger.warn("警告消息");
logger.error("发生错误");
```

### 数据转换

```typescript
const logger = createLogger({
  transform({ type, messages }) {
    return {
      timestamp: Date.now(),
      level: type,
      message: messages.join(' ')
    };
  },
  report({ data }) {
    // 发送到分析服务
    fetch('/api/logs', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
});
```

### 自定义样式

```typescript
import { webConsoleAdapter } from "@cmtlyt/logger/adapters/web";

const logger = createLogger({
  outputAdapters: [
    webConsoleAdapter({
      customStyle: ({ type, theme, baseStyle }) => {
        if (type === 'error') {
          theme.primary = '#ff4757';
          baseStyle.fontWeight = 'bold';
        }
        return { theme, baseStyle };
      }
    })
  ]
});
```

查看 [示例文件](./example/index.ts) 了解更多全面的使用方式。

## 浏览器兼容性

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 贡献

欢迎贡献代码！请随时提交 Pull Request。

## 许可证

MIT

## 更新日志

### v0.4.0
- 🛡️ 实现基于状态机的嵌套调用保护机制，防止栈溢出
- ⚡ 优化嵌套调用处理性能
- 🔧 增强TypeScript支持，添加完整的JSDoc文档注释
- 🐛 修复对象序列化中的循环引用处理

### v0.3.1
- 📚 初步JSDoc文档覆盖
- 🔧 基础TypeScript改进
- 🐛 小型bug修复
