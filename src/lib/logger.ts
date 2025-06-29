// 如果项目中没有日志工具，可以创建一个简单的
export function createLogger(namespace: string) {
  const prefix = `[${namespace}]`

  return {
    debug: (...args: unknown[]) => console.debug(prefix, ...args),
    info: (...args: unknown[]) => console.info(prefix, ...args),
    warn: (...args: unknown[]) => console.warn(prefix, ...args),
    error: (...args: unknown[]) => console.error(prefix, ...args),
    success: (...args: unknown[]) =>
      console.log(`%c${prefix} ✓`, 'color: green', ...args),
  }
}
