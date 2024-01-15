window.open = new Proxy(window.open, {
  apply(target, thisArg, args) {
    if (args[0]) args[0] = __$ampere.rewriteURL(args[0], __$ampere.base);
    return Reflect.apply(target, thisArg, args);
  }
});

document.open = new Proxy(document.open, {
  apply(target, thisArg, args) {
    if (args.length === 3) {
      args[0] = __$ampere.rewriteURL(args[0], __$ampere.base);
      return window.open(...args);
    }

    return Reflect.apply(target, thisArg, args);
  }
});
