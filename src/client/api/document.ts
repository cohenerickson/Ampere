import { setCookie } from "./cookie";
import { createLocationProxy } from "./location";

const backup = new Map<Document, Document>();

export function createDocumentProxy(meta: Document): Document {
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
          case "documentURI":
            return createLocationProxy(meta.location).toString();
          case "baseURI":
            return __$ampere.base;
          case "cookie":
            return __$ampere.cookie;
          case "referrer":
            try {
              return __$ampere.unwriteURL(new URL(meta.referrer).pathname);
            } catch {
              return "";
            }
          case "URL":
            return createLocationProxy(meta.location).toString();
          case "domain":
            return createLocationProxy(meta.location).hostname;
          case "write":
            return (...html: string[]): void => {
              meta.write(
                __$ampere.rewriteHTML(
                  html.join(""),
                  __$ampere.base,
                  __$ampere.cookie
                )
              );
            };
          case "writeln":
            return (...html: string[]): void => {
              meta.write(
                __$ampere.rewriteHTML(
                  html.join(""),
                  __$ampere.base,
                  __$ampere.cookie
                )
              );
            };
          default:
            const value = meta[prop as keyof Document];

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
        if (prop === "cookie") {
          return setCookie(newValue);
        }

        // @ts-ignore
        return (meta[prop] = newValue);
      }
    });

    backup.set(meta, bk);
  }

  return bk;
}
