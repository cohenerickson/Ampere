import { createDocumentProxy } from "./api/document";
import { createLocationProxy } from "./api/location";
import { createStorageProxy } from "./api/storage";
import { createWindowProxy } from "./api/window";

export function scope(value: any): any {
  if (!value) return value;

  if (value.constructor === Object) {
  }

  const type = value[Symbol.toStringTag];
  const functionName = typeof value === "function" ? value.name : undefined;

  const isNative = new RegExp(
    `^function ${
      type || functionName
    }\\(\\)\\s+\\{\\s+\\[native code\\]\\s+\\}$`
  ).test(value.constructor.toString());

  if (!isNative) return value;

  switch (type || functionName) {
    case "Window":
      return createWindowProxy(value);
    case "Location":
      return createLocationProxy(value);
    case "Storage":
      return createStorageProxy(value);
    case "HTMLDocument":
      return createDocumentProxy(value);
    case "postMessage":
      break;
    case "eval":
      return createWindowProxy(window).eval;
  }

  return value;
}
