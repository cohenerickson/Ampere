import { openDB, IDBPDatabase } from "idb";
import { Cookie } from "set-cookie-parser";

export class CookieDB {
  db: Promise<
    IDBPDatabase<{
      cookies: {
        key: string;
        value: Cookie;
      };
    }>
  >;

  constructor() {
    this.db = openDB("__$ampere", 1, {
      upgrade(db) {
        db.createObjectStore("cookies");
      }
    });
  }

  async findCookies(domain: string, path: string): Promise<Cookie[]> {
    const db = await this.db;

    const allCookies = await db.getAll("cookies");

    const cookies = allCookies.filter(
      (cookie) =>
        domainMatch(domain, cookie.domain ?? "") &&
        pathMatch(path, cookie.path ?? "/")
    );

    return cookies;
  }

  async putCookie(cookie: Cookie): Promise<void> {
    const db = await this.db;

    cookie.domain = cookie.domain?.replace(/^\./, "");

    await db.put(
      "cookies",
      cookie,
      `${cookie.domain}:${cookie.path}:${cookie.name}`
    );
  }

  async removeCookie(domain: string, path: string, key: string): Promise<void> {
    const db = await this.db;

    await db.delete("cookies", `${domain}:${path}:${key}`);
  }

  async removeCookies(domain: string, path: string): Promise<void> {
    const db = await this.db;

    const cookies = await db.getAll("cookies");

    for (const cookie of cookies) {
      if (cookie.domain === domain && cookie.path === path) {
        await db.delete(
          "cookies",
          `${cookie.domain}:${cookie.path}:${cookie.name}`
        );
      }
    }
  }

  async removeAllCookies(): Promise<void> {
    const db = await this.db;

    await db.clear("cookies");
  }

  async getAllCookies(): Promise<Cookie[]> {
    const db = await this.db;

    const cookies = await db.getAll("cookies");

    return cookies;
  }
}

const IP_REGEX =
  /(?:^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}$)|(?:^(?:(?:[a-f\d]{1,4}:){7}(?:[a-f\d]{1,4}|:)|(?:[a-f\d]{1,4}:){6}(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|:[a-f\d]{1,4}|:)|(?:[a-f\d]{1,4}:){5}(?::(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-f\d]{1,4}){1,2}|:)|(?:[a-f\d]{1,4}:){4}(?:(?::[a-f\d]{1,4}){0,1}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-f\d]{1,4}){1,3}|:)|(?:[a-f\d]{1,4}:){3}(?:(?::[a-f\d]{1,4}){0,2}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-f\d]{1,4}){1,4}|:)|(?:[a-f\d]{1,4}:){2}(?:(?::[a-f\d]{1,4}){0,3}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-f\d]{1,4}){1,5}|:)|(?:[a-f\d]{1,4}:){1}(?:(?::[a-f\d]{1,4}){0,4}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-f\d]{1,4}){1,6}|:)|(?::(?:(?::[a-f\d]{1,4}){0,5}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-f\d]{1,4}){1,7}|:)))$)/;

export function domainMatch(domStr: string, str: string): boolean | null {
  if (str == domStr) {
    return true;
  }

  const i = str.lastIndexOf(domStr);
  if (i <= 0) {
    return false;
  }

  if (str.length !== domStr.length + i) {
    return false;
  }

  if (str.substr(i - 1, 1) !== ".") {
    return false;
  }

  return !IP_REGEX.test(str);
}

export function pathMatch(reqPath: string, cookiePath: string): boolean {
  if (cookiePath === reqPath) {
    return true;
  }

  const i = reqPath.indexOf(cookiePath);
  if (i === 0) {
    if (cookiePath[cookiePath.length - 1] === "/") {
      return true;
    }

    if (
      new RegExp(`^${cookiePath}`).test(reqPath) &&
      reqPath[cookiePath.length] === "/"
    ) {
      return true;
    }
  }

  return false;
}
