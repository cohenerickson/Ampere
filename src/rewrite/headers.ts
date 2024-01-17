/*
  Other files within the /rewrite directory are for both client and server use.
  This file, due to it's server only nature, should never import anything from
  the /rewrite directory. Instead it should use the __$ampere global.
*/
import { setCookie, getCookie } from "../util/cookie";

export async function outgoing(
  headers: Headers,
  meta: string | URL
): Promise<Headers> {
  headers.set("Origin", new URL(meta).origin);
  headers.set("Host", new URL(meta).host);
  headers.set("Referer", meta.toString());

  const cookie = await getCookie(meta);

  __$ampere.logger.debug("Cookie", cookie);

  if (cookie !== undefined) {
    headers.set("Cookie", cookie || "");
  }

  return headers;
}

export async function incoming(
  headers: Headers,
  meta: string | URL
): Promise<Headers> {
  // Temporarily remove CSP headers until we do CSP emulation
  headers.delete("content-security-policy");
  headers.delete("content-security-policy-report-only");

  const cookies = headers.getSetCookie();

  for (const cookie of cookies) {
    await setCookie(cookie, meta);
  }

  return headers;
}
