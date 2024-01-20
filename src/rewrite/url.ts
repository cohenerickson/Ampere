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
    if (contentType === "text/html") {
      rewritten = rewriteHTML(data, meta, __$ampere.cookie ?? "");
    } else if (
      contentType === "application/javascript" ||
      contentType === "text/javascript"
    ) {
      rewritten = rewriteJS(data, meta);
    } else if (contentType === "text/css") {
      rewritten = rewriteCSS(data, meta);
    } else {
      return url.toString();
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
