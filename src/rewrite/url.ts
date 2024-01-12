export function rewriteURL(url: string | URL, meta: string | URL): string {
  if (url.toString().startsWith(__$ampere.config.prefix)) return url.toString();

  __$ampere.logger.debug(`Rewriting url ${url} with scope ${meta}`);

  // TODO: check data and blob urls for rewriting
  if (/^(data|blob):/.test(url.toString())) return url.toString();

  if (/^javascript:/.test(url.toString())) {
    const script = decodeURIComponent(
      url.toString().slice("javascript:".length)
    );
    const rewritten = __$ampere.rewriteJS(script, meta);

    return `javascript:${encodeURIComponent(rewritten)}`;
  }

  return `/~/` + __$ampere.config.codec.encode(new URL(url, meta).href);
}
