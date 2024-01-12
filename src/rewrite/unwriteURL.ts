export function unwriteURL(url: string): string {
  if (!url || !url.startsWith(__$ampere.config.prefix)) return url;

  return __$ampere.config.codec.decode(
    url.slice(__$ampere.config.prefix.length)
  );
}
