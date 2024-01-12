import { unwriteURL } from "../../rewrite/unwriteURL";
import { isFunction } from "../../util/isFunction";
import location from "./location";

const backup = new Map<Document, Document>();

export default function document(meta: Document): Document {
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
          case "documentURI":
            return location(meta.location).toString();
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
            return location(meta.location).toString();
          case "domain":
            return location(meta.location).hostname;
          case "write":
            return (...html: string[]): void => {
              meta.write(__$ampere.rewriteHTML(html.join(""), __$ampere.base));
            };
          case "writeln":
            return (...html: string[]): void => {
              meta.write(__$ampere.rewriteHTML(html.join(""), __$ampere.base));
            };
          case "open":
            return (...args: any[]) => {
              document(meta.open(...args));
            };
          default:
            const value = meta[prop as keyof Document];

            if (value && isFunction(value)) {
              return (value as Function).bind(meta);
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
