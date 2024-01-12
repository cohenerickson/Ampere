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

// window.WebSocket = new Proxy(window.WebSocket, {
//   async construct(target, args) {
//     const ws = __$ampere.bareClient.createWebSocket(args[0], args[1], {
//       setCookiesCallback(setCookies) {
//         for (const cookie of setCookies) {
//           document.cookie = cookie;
//         }
//       }
//     });

//     console.log(ws);

//     return ws;
//   }
// });

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
