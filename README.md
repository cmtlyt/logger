# @cmtlyt/logger

## Introduction

`@cmtlyt/logger` is a modern browser logging library focused on beautifying console log output and providing flexible extensibility. It not only enhances log presentation but also supports data reporting and custom adapters, making log processing more flexible and powerful.

## Features

- 🎨 **Beautified Console Output** - Provides beautiful browser console log styling
- 📊 **Data Reporting Capability** - Supports custom data transformation and reporting mechanisms
- 🔌 **Plugin Adapters** - Supports custom output adapters for flexible extension
- 🌐 **Web Adapter** - Built-in adapter optimized for browser environments
- 📦 **Lightweight** - No external dependencies, small footprint
- 🛠️ **TypeScript Support** - Complete type definition support

## Installation

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

## Quick Start

### Basic Usage

```typescript
import { createLogger } from "@cmtlyt/logger";

const logger = createLogger();

// Output logs of different levels
logger.debug("This is a debug message");
logger.info("This is an info message");
logger.warn("This is a warning message");
logger.error("This is an error message");
```

### Using Web Adapter

```typescript
import { createLogger } from "@cmtlyt/logger";
import { webConsoleAdapter } from "@cmtlyt/logger/adapters/web";

const logger = createLogger({
  outputAdapters: [webConsoleAdapter()],
});

logger.info("This will be output with beautified styling");
```

### Custom Configuration

```typescript
import { createLogger } from "@cmtlyt/logger";
import { webConsoleAdapter } from "@cmtlyt/logger/adapters/web";

const logger = createLogger({
  // Data transformation function
  transform(type, messages) {
    const [point, params, ...otherMessages] = messages;
    return {
      type,
      point,
      params,
      messages: otherMessages,
    };
  },

  // Data reporting function
  report(data) {
    // Send data to analytics service
    console.log("Reporting data:", data);
  },

  // Output adapters
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

logger.info("user_login", { userId: 123 }, "User login", "Extra info");
```

## API Reference

### createLogger(options)

Creates a logger instance.

**Parameters:**

- `options.transform` (Function, optional): Data transformation function that receives `(type, messages)` parameters
- `options.report` (Function, optional): Data reporting function that receives transformed data
- `options.outputAdapters` (Array, optional): Array of output adapters

**Return Value:**

A logger object that can be called via `logger.level(message)`.

### webConsoleAdapter(options)

Creates a Web console adapter.

**Parameters:**

- `options.group` (Object, optional): Group configuration
  - `enable` (Boolean): Whether to enable grouping, default `true`
  - `collapsed` (Boolean): Whether to collapse groups, default `true`
- `options.consoleLevel` (String, optional): Console output level, options `'debug'` | `'info'` | `'log'` | `'warn'`, default `'log'`
- `options.getSubTitle` (Function, optional): Function to get subtitle
- `options.getMessages` (Function, optional): Function to get messages
- `options.customStyle` (Function, optional): Function to customize styles

## Examples

See [example file](./example/index.ts) for more usage examples.

## License

MIT
