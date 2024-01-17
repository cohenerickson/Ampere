import { CookieDB, domainMatch, pathMatch } from "./CookieDB";
import { parse } from "set-cookie-parser";

export const cookieJar = new CookieDB();

export async function setCookie(
  cookieString: string,
  meta: string | URL
): Promise<void> {
  const cookie = parse(cookieString, {
    decodeValues: true,
    silent: true
  })[0];

  if (!cookie.domain) {
    cookie.domain = new URL(meta).host;
  }

  if (!cookie.path) {
    cookie.path = "/";
  }

  if (cookie.expires) {
    if (cookie.expires.getTime() < Date.now()) {
      if (
        domainMatch(new URL(meta).host, cookie.domain) &&
        pathMatch(new URL(meta).pathname, cookie.path)
      ) {
        await cookieJar.removeCookie(cookie.domain, cookie.path, cookie.name);
      } else {
        __$ampere.logger.warn(
          "Attempted to set cookie for invalid domain or path.",
          cookieString
        );
      }
    }
  }

  if (
    domainMatch(new URL(meta).host, cookie.domain) &&
    pathMatch(new URL(meta).pathname, cookie.path)
  ) {
    await cookieJar.putCookie(cookie);
  } else {
    __$ampere.logger.warn(
      "Attempted to set cookie for invalid domain or path.",
      cookieString
    );
  }
}

export async function getCookie(
  meta: string | URL
): Promise<string | undefined> {
  const cookies = await cookieJar.findCookies(
    new URL(meta).host,
    new URL(meta).pathname
  );

  return cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
}
