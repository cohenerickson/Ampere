import parse from "set-cookie-parser";

export function setCookie(value: string): string {
  const cookie = parse(value, {
    silent: true,
    decodeValues: false
  })[0];

  if (cookie.expires && cookie.expires.getTime() < Date.now()) {
    __$ampere.cookie = __$ampere.cookie
      .replace(`${cookie.name}=${cookie.value}`, "")
      .replace(/(;\s*){2,}/g, "; ");

    return value;
  }

  __$ampere.cookie = `${__$ampere.cookie}; ${cookie.name}=${cookie.value}}`;

  (async () => {
    await __$ampere.setCookie(value, __$ampere.base);
    __$ampere.cookie = (await __$ampere.getCookie(__$ampere.base)) ?? "";
  })();

  return value;
}

window.addEventListener("message", (event) => {
  if (event.data.type === "cookie") {
    __$ampere.cookie = event.data.value;
  }
});
