window.Function = new Proxy(Function, {
  apply(target, thisArg, args) {
    if (args[args.length - 1])
      args[args.length - 1] = __$ampere.rewriteJS(
        args[args.length - 1],
        __$ampere.base
      );

    return Reflect.apply(target, thisArg, args);
  }
});

window.Worker = new Proxy(Worker, {
  construct(target, args) {
    if (args[0]) args[0] = __$ampere.rewriteJS(args[0], __$ampere.base);

    return Reflect.construct(target, args);
  }
});

if ("imoportScripts" in self) {
  self.importScripts = new Proxy(self.importScripts, {
    apply(target, thisArg, args) {
      args = args.map((arg) => __$ampere.rewriteURL(arg, __$ampere.base));

      return Reflect.apply(target, thisArg, args);
    }
  });
}

export function createEvalProxy(evalFunction: (script: string) => any): any {
  new Proxy(evalFunction, {
    apply(target, thisArg, args) {
      if (args[0]) args[0] = __$ampere.rewriteJS(args[0], __$ampere.base);

      return Reflect.apply(target, thisArg, args);
    }
  });
}
