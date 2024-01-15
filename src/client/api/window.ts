import { createDocumentProxy } from "./document";
import { createLocationProxy } from "./location";
import { createEvalProxy } from "./scripting";
import { createStorageProxy } from "./storage";

const backup = new Map<
  Window & typeof globalThis,
  Window & typeof globalThis
>();

export function createWindowProxy(
  meta: Window & typeof globalThis
): Window & typeof globalThis {
  let bk = backup.get(meta);

  if (Object.values(backup).includes(meta)) {
    return meta;
  }

  if (!bk) {
    bk = new Proxy(meta, {
      get(target, prop, receiver) {
        switch (prop) {
          case "location":
            return createLocationProxy(meta.location);
          case "window":
            return createWindowProxy(meta.window);
          case "document":
            return createDocumentProxy(meta.document);
          case "self":
            return createWindowProxy(meta.self);
          case "top":
            // @ts-ignore
            return window(meta.top ?? meta.parent);
          case "parent":
            // @ts-ignore
            return createWindowProxy(meta.parent);
          case "opener":
            return createWindowProxy(meta.opener);
          case "globalThis":
            // @ts-ignore
            return createWindowProxy(meta.globalThis);
          case "eval":
            return createEvalProxy(meta.eval);
          case "localStorage":
            return createStorageProxy(meta.localStorage);
          case "sessionStorage":
            return createStorageProxy(meta.sessionStorage);
          default:
            const value = meta[prop as keyof Window];

            if (
              typeof value == "function" &&
              value.toString == self.Object.toString
            ) {
              return new Proxy(value, {
                apply(t, g, a) {
                  return Reflect.apply(t, meta, a);
                }
              });
            } else {
              return value;
            }
        }
      },
      set(target, prop, newValue, receiver) {
        // @ts-ignore
        meta[prop] = newValue;
        return true;
      }
    });

    backup.set(meta, bk);
  }

  return bk;
}
