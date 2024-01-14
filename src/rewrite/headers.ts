/*
  Other files within the /rewrite directory are for both client and server use.
  This file, due to it's server only nature, should never import anything from
  the /rewrite directory. Instead it should use the __$ampere global.
*/

export function outgoing(headers: Headers, meta: string | URL): Headers {
  headers.set("Origin", new URL(meta).origin);
  headers.set("Host", new URL(meta).host);
  headers.set("Referer", meta.toString());

  return headers;
}

export function incoming(headers: Headers, meta: string | URL): Headers {
  // Temporarily remove CSP headers until we do CSP emulation
  headers.delete("content-security-policy");
  headers.delete("content-security-policy-report-only");

  return headers;
}
