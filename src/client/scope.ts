import document from "./api/document";
import location from "./api/location";
import window from "./api/window";

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
      return window(value);
    case "Location":
      return location(value);
    case "History":
      break;
    case "Storage":
      break;
    case "HTMLDocument":
      return document(value);
    case "postMessage":
      break;
    case "eval":
      break;
  }

  return value;
}
