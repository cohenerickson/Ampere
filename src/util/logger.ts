export const logger = {
  log: (level: number, ...args: any[]) => {
    if (level <= globalThis.__$ampere.config.logLevel) {
      switch (level) {
        case 1:
          console.log("\x1B[35m[Ampere] \x1B[31mERROR:", ...args);
          break;
        case 2:
          console.log("\x1B[35m[Ampere] \x1B[33mWARN:", ...args);
          break;
        case 3:
          console.log("\x1B[35m[Ampere] \x1B[32mINFO:", ...args);
          break;
        case 4:
          console.log("\x1B[35m[Ampere] \x1B[34mDEBUG:", ...args);
          break;
      }
    }
  },
  error: (...args: any[]) => logger.log(1, ...args),
  warn: (...args: any[]) => logger.log(2, ...args),
  info: (...args: any[]) => logger.log(3, ...args),
  debug: (...args: any[]) => logger.log(4, ...args)
};
