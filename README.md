# @cmtlyt/logger

[中文文档](./README-zh.md) | English

## Introduction

`@cmtlyt/logger` is a modern, lightweight, cross-platform logging library that focuses on beautifying console output and providing flexible extensibility. It supports both **Node.js** and **Web** environments, offering advanced features like data reporting, custom adapters, nested call protection, and output control mechanisms.

## Features

- 🌍 **Cross-Platform Support** - Works seamlessly in both Node.js and Web environments
- 📊 **Data Reporting Capability** - Supports custom data transformation and reporting mechanisms
- 🔌 **Plugin Adapters** - Supports custom output adapters for flexible extension
- 🎨 **Beautified Output** - Built-in adapters provide beautiful console styling with customizable themes
- 🛡️ **Nested Call Protection** - Advanced state machine to prevent stack overflow with configurable depth limits
- 🎛️ **Output Control** - Fine-grained control over log output with `enableOutput` option
- 📦 **Lightweight** - No external dependencies, small footprint
- 🛠️ **TypeScript Support** - Complete type definition support with comprehensive JSDoc documentation
- 🎯 **Environment Detection** - Automatic environment detection and validation
- 🔄 **Circular Reference Handling** - Safe handling of circular references in logged objects
- 🎨 **Rich Styling** - Support for colors, gradients, and custom themes (Web adapter)

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

### Using Web Adapter (Browser)

```typescript
import { createLogger } from "@cmtlyt/logger";
import { webConsoleAdapter } from "@cmtlyt/logger/adapters/web";

const logger = createLogger({
  outputAdapters: [webConsoleAdapter()],
});

logger.info("This will be output with beautified styling");
```

### Using Node.js Adapter (Server)

```typescript
import { createLogger } from "@cmtlyt/logger";
import { nodeConsoleAdapter } from "@cmtlyt/logger/adapters/node";

const logger = createLogger({
  outputAdapters: [nodeConsoleAdapter({
    enableColors: true,
    format: "[%type][%date] %message",
  })],
});

logger.info("This will be output with colors in Node.js");
```

### Advanced Configuration

```typescript
import { createLogger } from "@cmtlyt/logger";
import { webConsoleAdapter } from "@cmtlyt/logger/adapters/web";

const logger = createLogger({
  // Output control - can be boolean or function
  enableOutput: ({ type }) => type !== 'debug' || process.env.NODE_ENV === 'development',

  // Maximum nesting depth to prevent stack overflow
  maxNestingDepth: 3,

  // Data transformation function
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

  // Data reporting function
  report({ data }) {
    // Send data to analytics service
    if (data.type === 'error') {
      fetch('/api/error-tracking', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    }
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

### Output Control with enableOutput

The `enableOutput` option provides fine-grained control over log output while preserving data processing:

```typescript
const logger = createLogger({
  // Boolean control
  enableOutput: false, // Disables all output but keeps transform/report

  // Function control for dynamic behavior
  enableOutput: ({ type, messages, data }) => {
    // Only output errors in production
    if (process.env.NODE_ENV === 'production') {
      return type === 'error';
    }
    // Output everything in development
    return true;
  },

  transform({ type, messages }) {
    return { type, messages, timestamp: Date.now() };
  },

  report({ data }) {
    // This still executes even when enableOutput is false
    sendToAnalytics(data);
  }
});
```

### Nested Call Protection

The logger includes advanced protection against stack overflow through a sophisticated state machine. This prevents infinite recursion when logger functions are called within transform/report functions:

```typescript
const logger = createLogger({
  maxNestingDepth: 3, // Maximum allowed nesting depth
  transform({ type, messages, isNestingCall }) {
    // This could potentially cause nested calls
    if (!isNestingCall) {
      logger.debug("Transform called for", type); // Nesting level 1
    }
    return { type, messages, isNesting: isNestingCall };
  },
  report({ data }) {
    // This could also cause nested calls
    if (!data.isNesting) {
      logger.info("Reporting data", data); // Nesting level 2
    }
  }
});

// The logger automatically tracks nesting depth and discards calls
// that exceed the maximum depth to prevent stack overflow
logger.info("This triggers transform and report functions");
```

### Cross-Platform Adapters

#### Web Adapter Features
- Beautiful console styling with CSS
- Support for gradients and custom themes
- Grouping and collapsing
- Custom window width detection

#### Node.js Adapter Features
- Color support via yoctocolors
- Customizable output formats
- Text cleaning and formatting
- Environment-specific optimizations

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
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [${type.toUpperCase()}]`, ...info.messages);
    };
  };
});

const logger = createLogger({
  outputAdapters: [customAdapter({ enableDebug: false })],
});
```

### Environment Detection

Both adapters automatically detect their respective environments:

```typescript
import { webConsoleAdapter, isWeb } from "@cmtlyt/logger/adapters/web";
import { nodeConsoleAdapter, isNode } from "@cmtlyt/logger/adapters/node";

// Manual environment checks
if (isWeb()) {
  console.log("Running in browser");
}

if (isNode()) {
  console.log("Running in Node.js");
}

// Automatic environment validation in adapters
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

## API Reference

### createLogger(options)

Creates a logger instance.

**Parameters:**

- `options.enableOutput` (Boolean|Function, optional): Controls log output, default `true`
- `options.maxNestingDepth` (Number, optional): Maximum nesting depth, default `3`
- `options.transform` (Function, optional): Data transformation function that receives `({ type, messages, isNestingCall })` parameters
- `options.report` (Function, optional): Data reporting function that receives `({ type, messages, isNestingCall, data })` parameters
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
- `options.getWindowWidth` (Function, optional): Function to get window width for layout
- `options.isEnvironmentValid` (Function, optional): Environment validation function

### nodeConsoleAdapter(options)

Creates a Node.js console adapter with color support and formatting options.

**Parameters:**

- `options.enableColors` (Boolean, optional): Enable color output, default `true`
- `options.outputLevel` (String, optional): Console output level, options `'log'` | `'info'` | `'warn'` | `'error'`, default `'log'`
- `options.allowTypes` (Array|Set|Function, optional): Allowed log types filter
- `options.format` (String, optional): Output format string with placeholders
- `options.getLabel` (Function, optional): Function to get label
- `options.getMessages` (Function, optional): Function to get messages
- `options.formatDate` (Function, optional): Function to format date
- `options.customColors` (Function, optional): Function to customize colors
- `options.customColorizer` (Function, optional): Function to customize color application
- `options.textCleaner` (Function, optional): Function to clean formatted text
- `options.isEnvironmentValid` (Function, optional): Environment validation function

### Utility Functions

#### defineAdapter(callback)

Helper function for creating type-safe adapters.

#### objectStringify(obj)

Safely stringify objects with function and circular reference handling.

#### isWeb()

Detect if running in a web browser environment.

#### isNode()

Detect if running in a Node.js environment.

## Examples

### Basic Cross-Platform Usage

```typescript
import { createLogger } from "@cmtlyt/logger";
import { webConsoleAdapter } from "@cmtlyt/logger/adapters/web";
import { nodeConsoleAdapter } from "@cmtlyt/logger/adapters/node";

const logger = createLogger({
  outputAdapters: [
    // Will only work in browser
    webConsoleAdapter(),
    // Will only work in Node.js
    nodeConsoleAdapter({ enableColors: true }),
  ],
});

logger.info("This works in both environments!");
```

### Conditional Output Control

```typescript
const logger = createLogger({
  enableOutput: ({ type, data }) => {
    // Only log errors in production
    if (process.env.NODE_ENV === 'production') {
      return type === 'error';
    }
    
    // Log everything in development
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
    // Always report to analytics, regardless of enableOutput
    if (data.level === 'error') {
      sendErrorToService(data);
    }
  }
});
```

### Advanced Node.js Formatting

```typescript
import { nodeConsoleAdapter } from "@cmtlyt/logger/adapters/node";

const logger = createLogger({
  outputAdapters: [
    nodeConsoleAdapter({
      format: "[%type][%label][%date] %message %othermessages",
      getLabel: (info) => `APP-${info.type.toUpperCase()}`,
      formatDate: (date) => date.toLocaleString('en-US'),
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

### Web Styling with Gradients

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

See [example files](./example/) for more comprehensive usage examples.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Changelog

### v0.5.0
- 🌍 **Cross-Platform Support** - Added Node.js adapter with full feature parity
- 🎛️ **Output Control** - New `enableOutput` option for fine-grained output control
- 🎨 **Enhanced Styling** - Improved gradient support and custom theme capabilities
- 🔧 **Better TypeScript** - Enhanced type definitions and JSDoc documentation
- ⚡ **Performance** - Optimized nested call handling and adapter selection
- 🐛 **Bug Fixes** - Fixed nested depth control logic and circular reference handling

### v0.4.0
- 🛡️ Implemented nested call protection with state machine to prevent stack overflow
- ⚡ Performance optimizations for nested call handling
- 🔧 Enhanced TypeScript support with comprehensive JSDoc documentation
- 🐛 Fixed circular reference handling in object serialization

### v0.3.1
- 📚 Initial JSDoc documentation coverage
- 🔧 Basic TypeScript improvements
- 🐛 Minor bug fixes
