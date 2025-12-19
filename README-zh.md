# @cmtlyt/logger

## 介绍

`@cmtlyt/logger` 是一个现代化的浏览器日志库，专注于美化控制台日志输出并提供灵活的扩展能力。它不仅能够美化日志展示，还支持埋点上报和自定义适配器，让日志处理更加灵活和强大。

## 功能特性

- 🎨 **美化控制台输出** - 提供美观的浏览器控制台日志样式
- 📊 **埋点上报能力** - 支持自定义数据转换和上报机制
- 🔌 **插件化适配器** - 支持自定义输出适配器，灵活扩展
- 🌐 **Web 适配器** - 内置专门针对浏览器环境优化的适配器
- 📦 **轻量级** - 无外部依赖，体积小巧
- 🛠️ **TypeScript 支持** - 完整的类型定义支持

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

### 自定义配置

```typescript
import { createLogger } from "@cmtlyt/logger";
import { webConsoleAdapter } from "@cmtlyt/logger/adapters/web";

const logger = createLogger({
  // 数据转换函数
  transform(type, messages) {
    const [point, params, ...otherMessages] = messages;
    return {
      type,
      point,
      params,
      messages: otherMessages,
    };
  },

  // 数据上报函数
  report(data) {
    // 发送数据到埋点服务
    console.log("上报数据:", data);
  },

  // 输出适配器
  outputAdapters: [
    webConsoleAdapter({
      group: {
        enable: false,
        collapsed: false,
      },
      consoleLevel: "log",
      getSubTitle: (info) => info.transformData?.point || "",
      getMessages: (info) => info.messages.slice(1),
      customStyle: (info) => {
        info.baseStyle.fontSize = "8px";
        return info;
      },
    }),
  ],
});

logger.info("user_login", { userId: 123 }, "用户登录", "额外信息");
```

## API 说明

### createLogger(options)

创建一个日志实例。

**参数:**

- `options.transform` (Function, 可选): 数据转换函数，接收 `(type, messages)` 参数
- `options.report` (Function, 可选): 数据上报函数，接收转换后的数据
- `options.outputAdapters` (Array, 可选): 输出适配器数组

**返回值:**

一个日志对象，可以通过 `logger.级别(消息)` 的方式调用。

### webConsoleAdapter(options)

创建一个 Web 控制台适配器。

**参数:**

- `options.group` (Object, 可选): 分组配置
  - `enable` (Boolean): 是否启用分组，默认 `true`
  - `collapsed` (Boolean): 是否折叠分组，默认 `true`
- `options.consoleLevel` (String, 可选): 控制台输出级别，可选 `'debug'` | `'info'` | `'log'` | `'warn'`，默认 `'log'`
- `options.getSubTitle` (Function, 可选): 获取子标题函数
- `options.getMessages` (Function, 可选): 获取消息函数
- `options.customStyle` (Function, 可选): 自定义样式函数

## 示例

查看 [示例文件](./example/index.ts) 了解更多使用方式。

## License

MIT
