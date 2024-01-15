import { rewriteURL } from "./url";

export function rewriteCSS(css: string, meta: string | URL): string {
  // Regex fuckery
  return css.replace(
    /(?<!(?:["']|@import\s))(?:@import\s?(?:url)?|url)\(?['"]?(?<url>.*?)['")]/gim,
    (...args) => {
      try {
        const groups = args[args.length - 1];

        if (groups.url) {
          return args[0].replace(groups.url, rewriteURL(groups.url, meta));
        } else {
          return args[0];
        }
      } catch (e) {
        __$ampere.logger.error("Failed to rewrite CSS", e);
        return args[0];
      }
    }
  );
}
