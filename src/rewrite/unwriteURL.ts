export function unwriteURL(url: string): string {
  return __$ampere.config.codec.decode(
    url.slice(__$ampere.config.prefix.length)
  );
}
