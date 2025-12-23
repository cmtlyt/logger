export function createAllowTypesChecker(allowTypes?: string[] | Set<string> | ((type: string) => boolean)) {
  const defaultTypes = new Set(['debug', 'info', 'warn', 'error']);

  if (!allowTypes) {
    return defaultTypes;
  }

  if (typeof allowTypes === 'function') {
    // 函数格式：完全替换逻辑
    return allowTypes;
  }

  if (Array.isArray(allowTypes)) {
    // 数组格式：扩展逻辑（在默认类型基础上添加）
    const extendedTypes = new Set(defaultTypes);
    allowTypes.forEach((type) => {
      extendedTypes.add(type);
    });
    return extendedTypes;
  }

  // Set格式：完全替换逻辑
  return allowTypes;
}

export function isTypeAllowed(logType: string, checker: Set<string> | ((type: string) => boolean)) {
  if (typeof checker === 'function') {
    return checker(logType);
  }
  return checker.has(logType);
}
