export function isFunction(value: any): boolean {
  try {
    return typeof value === "function"
      ? value.prototype
        ? Object.getOwnPropertyDescriptor(value, "prototype")!.writable
          ? true
          : false
        : value.constructor.name === "AsyncFunction"
          ? true
          : true
      : false;
  } catch {
    return false;
  }
}
