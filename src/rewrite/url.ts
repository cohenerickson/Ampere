import { rewriteCSS } from "./css";
import { rewriteHTML } from "./html";
import { rewriteJS } from "./js";

export function rewriteURL(url: string | URL, meta: string | URL): string {
  // Cases where we don't want to rewrite
  if (url.toString().startsWith(__$ampere.config.prefix)) return url.toString();
  if (/^blob:/.test(url.toString())) return url.toString();

  __$ampere.logger.debug(`Rewriting url ${url} with scope ${meta}`);

  if (/^data:/.test(url.toString())) {
    const contentType = url.toString().match(/^data:(.*?)(;|,)/)?.[1] ?? "";
    const isBase64 = /;base64,$/.test(url.toString());
    const content = url
      .toString()
      .slice(`data:${contentType}${isBase64 ? ";base64" : ""},`.length);

    const data = isBase64 ? atob(content) : decodeURIComponent(content);

    let rewritten = data;
    switch (contentType) {
      case "text/html":
        rewritten = rewriteHTML(data, meta);
      case "application/javascript":
      case "text/javascript":
        rewritten = rewriteJS(data, meta);
      case "text/css":
        rewritten = rewriteCSS(data, meta);
      default:
        rewritten = data;
    }

    return `data:${contentType}${isBase64 ? ";base64" : ""},${
      isBase64 ? btoa(rewritten) : encodeURIComponent(rewritten)
    }`;
  }

  if (/^javascript:/.test(url.toString())) {
    const script = decodeURIComponent(
      url.toString().slice("javascript:".length)
    );
    const rewritten = __$ampere.rewriteJS(script, meta);

    return `javascript:${encodeURIComponent(rewritten)}`;
  }

  return `/~/` + __$ampere.config.codec.encode(new URL(url, meta).href);
}
