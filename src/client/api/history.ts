function createHistoryProxy(
  func: History["pushState"] | History["replaceState"]
) {
  return new Proxy(func, {
    apply(target: any, thisArg: any, args: any[]) {
      __$ampere.logger.debug("Hooking history update", args[2]);

      if (args[2]) args[2] = __$ampere.rewriteURL(args[2], __$ampere.base);
      return Reflect.apply(target, thisArg, args);
    }
  });
}

history.pushState = createHistoryProxy(history.pushState);
history.replaceState = createHistoryProxy(history.replaceState);
