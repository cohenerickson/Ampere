import { unwriteURL } from "../../rewrite/unwriteURL";
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
            // TODO: cookies and storage
            return "";
          case "referrer":
            try {
              return unwriteURL(new URL(meta.referrer).pathname);
            } catch {
              return "";
            }
          case "URL":
            return createLocationProxy(meta.location).toString();
          case "domain":
            return createLocationProxy(meta.location).hostname;
          case "write":
            return (...html: string[]): void => {
              meta.write(__$ampere.rewriteHTML(html.join(""), __$ampere.base));
            };
          case "writeln":
            return (...html: string[]): void => {
              meta.write(__$ampere.rewriteHTML(html.join(""), __$ampere.base));
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
        // TODO: Cookies and storage
        if (prop === "cookie") {
          return true;
        }

        // @ts-ignore
        return (meta[prop] = newValue);
      }
    });

    backup.set(meta, bk);
  }

  return bk;
}
