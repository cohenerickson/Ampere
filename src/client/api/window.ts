import document from "./document";
import location from "./location";

const backup = new Map<
  Window & typeof globalThis,
  Window & typeof globalThis
>();

export default function window(
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
            return location(meta.location);
          case "window":
            return window(meta.window);
          case "document":
            return document(meta.document);
          case "self":
            return window(meta.self);
          case "top":
            // @ts-ignore
            return window(meta.top ?? meta.parent);
          case "parent":
            // @ts-ignore
            return window(meta.parent);
          case "opener":
            return window(meta.opener);
          case "globalThis":
            // @ts-ignore
            return window(meta.globalThis);

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
