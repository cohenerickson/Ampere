export function rewriteURL(url: string | URL, scope: string | URL): string {
  return `/~/` + new URL(url, scope).href;
}
