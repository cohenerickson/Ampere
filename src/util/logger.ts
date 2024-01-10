export const logger = {
  log: (level: number, ...args: any[]) => {
    if (level <= globalThis.__$ampere.config.logLevel) {
      switch (level) {
        case 1:
          console.error(...args);
          break;
        case 2:
          console.warn(...args);
          break;
        case 3:
          console.info(...args);
          break;
        case 4:
          console.debug(...args);
          break;
        default:
          console.log(...args);
          break;
      }
    }
  },
  error: (...args: any[]) => logger.log(1, ...args),
  warn: (...args: any[]) => logger.log(2, ...args),
  info: (...args: any[]) => logger.log(3, ...args),
  debug: (...args: any[]) => logger.log(4, ...args)
};
