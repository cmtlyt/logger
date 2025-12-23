# @cmtlyt/logger

[中文文档](./README-zh.md) | English

## Introduction

`@cmtlyt/logger` is a modern, lightweight browser logging library that focuses on beautifying console output and providing flexible extensibility. It not only enhances log presentation but also supports data reporting, custom adapters, and advanced features like nested call protection and code obfuscation.

## Features

- 📊 **Data Reporting Capability** - Supports custom data transformation and reporting mechanisms
- 🔌 **Plugin Adapters** - Supports custom output adapters for flexible extension
- 🎨 **Web Adapter with Beautified Output** - Built-in adapter that provides beautiful browser console styling with customizable themes
- 🛡️ **Nested Call Protection** - Advanced state machine to prevent stack overflow with configurable depth limits
- 🔒 **Code Obfuscation** - Built-in code obfuscation support for production builds
- 📦 **Lightweight** - No external dependencies, small footprint
- 🛠️ **TypeScript Support** - Complete type definition support with comprehensive JSDoc documentation
- 🎯 **Environment Detection** - Automatic environment detection and validation
- 🔄 **Circular Reference Handling** - Safe handling of circular references in logged objects

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

### Advanced Configuration

```typescript
import { createLogger } from "@cmtlyt/logger";
import { webConsoleAdapter } from "@cmtlyt/logger/adapters/web";

const logger = createLogger({
  // Maximum nesting depth to prevent stack overflow
  maxNestingDepth: 3,

  // Data transformation function
  transform({ type, messages }) {
    const [point, params, ...otherMessages] = messages;
    return {
      type,
      point,
      params,
      messages: otherMessages,
    };
  },

  // Data reporting function
  report({ data }) {
    // Send data to analytics service
    console.log("Reporting data:", data);
  },

  // Output adapters
  outputAdapters: [
    webConsoleAdapter({
      group: {
        enable: true,
        collapsed: false,
      },
      consoleLevel: "info",
      allowTypes: ['info', 'warn', 'error'], // Filter log types
      getSubTitle: (info) => info.transformData?.point || "",
      getMessages: (info) => info.messages.slice(1),
      customStyle: (info) => {
        // Customize theme colors
        info.theme.primary = "#007bff";
        info.baseStyle.fontSize = "12px";
        return info;
      },
    }),
  ],
});

logger.info("user_login", { userId: 123 }, "User login", "Extra info");
```

## Core Features

### Nested Call Protection

The logger includes advanced protection against stack overflow through a sophisticated state machine. This prevents infinite recursion when logger functions are called within transform/report functions:

```typescript
const logger = createLogger({
  maxNestingDepth: 3, // Maximum allowed nesting depth
  transform({ type, messages }) {
    // This could potentially cause nested calls
    logger.debug("Transform called for", type); // Nesting level 1
    return { type, messages };
  },
  report({ data }) {
    // This could also cause nested calls
    logger.info("Reporting data", data); // Nesting level 2
  }
});

// The logger automatically tracks nesting depth and discards calls
// that exceed the maximum depth to prevent stack overflow
logger.info("This triggers transform and report functions");
```

### Custom Adapters

Create your own output adapters:

```typescript
import { defineAdapter } from "@cmtlyt/logger/adapters";

const customAdapter = defineAdapter((options) => {
  return (type) => {
    // Return null to skip this type
    if (type === 'debug' && !options.enableDebug) {
      return null;
    }

    // Return output function
    return (info) => {
      // Custom output logic
      console.log(`[${type.toUpperCase()}]`, ...info.messages);
    };
  };
});

const logger = createLogger({
  outputAdapters: [customAdapter({ enableDebug: false })],
});
```

### Environment Detection

The Web adapter automatically detects the environment:

```typescript
import { webConsoleAdapter, isWeb } from "@cmtlyt/logger/adapters/web";

// Manual environment check
if (isWeb()) {
  console.log("Running in browser");
}

// Automatic environment validation in adapter
const logger = createLogger({
  outputAdapters: [
    webConsoleAdapter({
      isEnvironmentValid: () => typeof window !== 'undefined',
    }),
  ],
});
```

## API Reference

### createLogger(options)

Creates a logger instance.

**Parameters:**

- `options.maxNestingDepth` (Number, optional): Maximum nesting depth, default `3`
- `options.transform` (Function, optional): Data transformation function that receives `({ type, messages })` parameters
- `options.report` (Function, optional): Data reporting function that receives `({ data })` parameter
- `options.outputAdapters` (Array, optional): Array of output adapters

**Return Value:**

A logger object with methods for different log levels: `debug`, `info`, `warn`, `error`, etc.

### webConsoleAdapter(options)

Creates a Web console adapter with advanced styling and configuration options.

**Parameters:**

- `options.group` (Object, optional): Group configuration
  - `enable` (Boolean): Whether to enable grouping, default `true`
  - `collapsed` (Boolean): Whether to collapse groups, default `false`
- `options.consoleLevel` (String, optional): Console output level, options `'debug'` | `'info'` | `'log'` | `'warn'`, default `'log'`
- `options.allowTypes` (Array|Set|Function, optional): Allowed log types filter
- `options.getSubTitle` (Function, optional): Function to get subtitle
- `options.getMessages` (Function, optional): Function to get messages
- `options.customStyle` (Function, optional): Function to customize styles and themes
- `options.isEnvironmentValid` (Function, optional): Environment validation function

### Utility Functions

#### defineAdapter(callback)

Helper function for creating type-safe adapters.

#### objectStringify(obj)

Safely stringify objects with function and circular reference handling.

#### isWeb()

Detect if running in a web browser environment.

## Examples

### Basic Logging

```typescript
import { createLogger } from "@cmtlyt/logger";

const logger = createLogger();

logger.debug("Debug information");
logger.info("General information");
logger.warn("Warning message");
logger.error("Error occurred");
```

### With Data Transformation

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
    // Send to analytics
    fetch('/api/logs', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
});
```

### Custom Styling

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

See [example file](./example/index.ts) for more comprehensive usage examples.

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Changelog

### v0.4.0
- 🛡️ Implemented nested call protection with state machine to prevent stack overflow
- ⚡ Performance optimizations for nested call handling
- 🔧 Enhanced TypeScript support with comprehensive JSDoc documentation
- 🐛 Fixed circular reference handling in object serialization

### v0.3.1
- 📚 Initial JSDoc documentation coverage
- 🔧 Basic TypeScript improvements
- 🐛 Minor bug fixes
