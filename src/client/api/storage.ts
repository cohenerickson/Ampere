const backup = new Map<Storage, Storage>();

export function createStorageProxy(meta: Storage): Storage {
  let bk = backup.get(meta);

  if (!bk) {
    bk = new Proxy(Object.setPrototypeOf({}, Storage.prototype), {
      get(t, prop: string | symbol): any {
        const storage = Object.fromEntries(
          Object.entries(meta)
            .filter(([key]) =>
              key.endsWith(`@${__$ampere.scope(location).host}`)
            )
            .map(([key, value]) => [
              key.slice(
                0,
                key.length - __$ampere.scope(location).host.length - 1
              ),
              value
            ])
        ) as any;

        if (prop === "getItem") {
          return (key: string): string | null => {
            return meta.getItem(`${key}@${__$ampere.scope(location).host}`);
          };
        } else if (prop === "setItem") {
          return (key: string, value: string): void => {
            return meta.setItem(
              `${key}@${__$ampere.scope(location).host}`,
              value
            );
          };
        } else if (prop === "removeItem") {
          return (key: string): void => {
            return meta.removeItem(`${key}@${__$ampere.scope(location).host}`);
          };
        } else if (prop === "key") {
          return (index: number) => {
            return Object.keys(storage)[index];
          };
        } else if (prop === "clear") {
          return (): void => {
            Object.keys(storage).forEach((key) => {
              meta.removeItem(`${key}@${__$ampere.scope(location).host}`);
            });
          };
        }

        return storage[prop];
      },
      ownKeys(): ArrayLike<string | symbol> {
        return Object.keys(meta)
          .filter((key) => key.endsWith(`@${__$ampere.scope(location).host}`))
          .map((key) =>
            key.slice(0, key.length - __$ampere.scope(location).host.length - 1)
          );
      },
      getOwnPropertyDescriptor(): PropertyDescriptor {
        return {
          enumerable: true,
          configurable: true
        };
      },
      set(t, key: string | symbol, value: any): boolean {
        meta.setItem(
          `${key.toString()}@${__$ampere.scope(location).host}`,
          value
        );
        return true;
      }
    }) as Storage;

    backup.set(meta, bk);
  }

  return bk;
}
