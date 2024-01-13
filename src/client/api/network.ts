window.fetch = new Proxy(fetch, {
  apply(target, thisArg, argArray) {
    __$ampere.logger.debug("Hooking fetch", argArray[0]);

    if (argArray[0] && typeof argArray[0] === "string") {
      argArray[0] = __$ampere.rewriteURL(argArray[0], __$ampere.base);
    }

    return Reflect.apply(target, thisArg, argArray);
  }
});

navigator.sendBeacon = new Proxy(navigator.sendBeacon, {
  apply(target, thisArg, args) {
    __$ampere.logger.debug("Hooking sendBeacon", args[0]);

    if (args[0]) {
      args[0] = __$ampere.rewriteURL(args[0], __$ampere.base);
    }
    return Reflect.apply(target, thisArg, args);
  }
});

window.XMLHttpRequest.prototype.open = new Proxy(
  window.XMLHttpRequest.prototype.open,
  {
    apply(target, thisArg, args) {
      __$ampere.logger.debug("Hooking XHR.open", args[1]);

      if (args[1]) {
        args[1] = __$ampere.rewriteURL(args[1].toString(), __$ampere.base);
      }
      return Reflect.apply(target, thisArg, args);
    }
  }
);

window.WebSocket = new Proxy(window.WebSocket, {
  construct(target, args) {
    const ws = new target(
      `${location.protocol.replace("http", "ws")}//${
        new URL(__$ampere.bare).host
      }/v3/`
    );
    let readyState = 0;

    const READY_STATE = Object.getOwnPropertyDescriptor(
      WebSocket.prototype,
      "readyState"
    )?.get;

    Object.defineProperty(ws, "readyState", {
      get() {
        if (readyState === 0) {
          return 0;
        } else {
          return READY_STATE?.call(ws);
        }
      }
    });

    function message(event: MessageEvent) {
      event.preventDefault();
      event.stopImmediatePropagation();

      const message = JSON.parse(event.data);

      if (message.type === "open") {
        message.setCookies.forEach((cookie: string) => {
          __$ampere.scope(document).cookie = cookie;
        });

        Object.defineProperties(ws, {
          protocol: {
            value: message.protocol
          },
          url: {
            value: args[0]
          }
        });

        readyState = 1;

        ws.dispatchEvent(new Event("open"));
      } else {
        ws.close();
      }
    }

    ws.addEventListener("message", message, { once: true });

    function open(event: Event) {
      event.preventDefault();
      event.stopImmediatePropagation();

      ws.send(
        JSON.stringify({
          type: "connect",
          remote: args[0],
          protocols: args[1] ? [args[1]].flat() : [],
          headers: {
            "Cache-Control": "no-cache",
            Connection: "Upgrade",
            Host: new URL(args[0]).host,
            Origin: __$ampere.scope(location).origin,
            Pragma: "no-cache",
            Upgrade: "websocket",
            "User-Agent": navigator.userAgent,
            Cookie: __$ampere.scope(document).cookie
          },
          forwardHeaders: []
        })
      );
    }

    ws.addEventListener("open", open, { once: true });

    return ws;
  }
});

window.Request = new Proxy(Request, {
  construct(target, args) {
    __$ampere.logger.debug("Hooking Request constructor", args[0]);

    if (args[0] && typeof args[0] === "string") {
      args[0] = __$ampere.rewriteURL(args[0], __$ampere.base);
    }

    return new Proxy(Reflect.construct(target, args), {
      get(target, prop) {
        if (prop === "url") {
          return __$ampere.unwriteURL(target[prop]);
        }

        return Reflect.get(target, prop);
      }
    });
  }
});

window.Response = new Proxy(Response, {
  construct(target, args) {
    return new Proxy(Reflect.construct(target, args), {
      get(target, prop) {
        if (prop === "url") {
          return __$ampere.unwriteURL(target[prop]);
        }

        return Reflect.get(target, prop);
      }
    });
  }
});
