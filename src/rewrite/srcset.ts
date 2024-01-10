import { rewriteURL } from "./url";

export function rewriteSrcSet(srcset: string, scope: string | URL): string {
  return srcset
    .split(",")
    .map((src) => {
      const [url, ...rest] = src.trim().split(" ");
      return rewriteURL(url, scope) + " " + rest.join(" ");
    })
    .join(",");
}
