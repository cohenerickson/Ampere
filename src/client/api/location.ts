import { createDOMStringList } from "../../util/DOMStringList";

const backup = new Map<Location, Location>();

export default function location(meta: Location): Location {
  let bk = backup.get(meta);

  if (Object.values(backup).includes(meta)) {
    return meta;
  }

  if (!bk) {
    bk = new Proxy(Object.setPrototypeOf({}, Location.prototype), {
      get(t, prop: string | symbol): any {
        let loc = new URL(meta.href);
        if (meta.href === "about:srcdoc" || meta.href === "about:blank") {
          loc = new URL(__$ampere.unwriteURL(parent.location.pathname));
        } else if (meta.href.startsWith(__$ampere.config.prefix)) {
          loc = new URL(__$ampere.unwriteURL(meta.pathname));
        }

        if (prop === "constructor") {
          return meta.constructor;
        } else if (prop === Symbol.toStringTag) {
          return "Location";
        } else if (prop === "assign") {
          return (url: string) => {
            meta.assign(__$ampere.rewriteURL(url, __$ampere.scope(meta)));
          };
        } else if (prop === "reload") {
          return () => {
            meta.reload();
          };
        } else if (prop === "replace") {
          return (url: string) => {
            meta.replace(__$ampere.rewriteURL(url, __$ampere.scope(meta)));
          };
        } else if (prop === "toString") {
          return () => {
            return __$ampere.scope(meta).href;
          };
        } else if (prop === "ancestorOrigins") {
          return createDOMStringList([]);
        }

        // @ts-ignore
        if (typeof loc[prop] !== "undefined") {
          // @ts-ignore
          return loc[prop];
        }

        return undefined;
      },
      ownKeys(): ArrayLike<string | symbol> {
        return Object.keys(meta);
      },
      getOwnPropertyDescriptor(): PropertyDescriptor {
        return {
          enumerable: true,
          configurable: true
        };
      },
      set(t, prop: keyof URL, value: string): boolean {
        const loc = new URL(__$ampere.unwriteURL(meta.pathname)) as any;

        if (!loc[prop]) {
          return false;
        }

        loc[prop] = value;

        meta.href = __$ampere.rewriteURL(loc.toString(), __$ampere.scope(meta));

        return true;
      }
    }) as Location;

    backup.set(meta, bk);
  }

  return bk;
}
