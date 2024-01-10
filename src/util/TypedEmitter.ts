export class TypedEmitter<
  T extends { [K in keyof T]: (...args: any[]) => any }
> {
  private listeners: { [K in keyof T]: Array<T[K]> } = {} as any;

  public on<K extends keyof T>(event: K, listener: T[K]) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(listener);
  }

  public once<K extends keyof T>(event: K, listener: T[K]) {
    const onceListener = ((...args) => {
      this.off(event, onceListener);
      return listener(...args);
    }) as T[K];

    this.on(event, onceListener);
  }

  public off<K extends keyof T>(event: K, listener: T[K]) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter((l) => l !== listener);
  }

  public async emit<K extends keyof T>(event: K, ...args: Parameters<T[K]>) {
    let value: ReturnType<T[K]> | undefined;

    if (!this.listeners[event]) return;
    for (const listener of this.listeners[event]) {
      value = (await listener(...args)) ?? value;
    }

    return value;
  }
}
