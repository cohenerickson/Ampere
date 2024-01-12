import { rewriteURL } from "./url";

export function rewriteSrcSet(srcset: string, meta: string | URL): string {
  return srcset
    .split(",")
    .map((src) => {
      const [url, ...rest] = src.trim().split(" ");
      return rewriteURL(url, meta) + " " + rest.join(" ");
    })
    .join(",");
}
