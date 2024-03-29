import "./api/element";
import "./api/history";
import "./api/navigator";
import "./api/network";
import "./api/open";
import "./pluginLoader";
import { scope } from "./scope";

Object.defineProperty(Object.prototype, "__$ampere", {
  value: Object.assign(globalThis.__$ampere || {}, { scope }),
  configurable: false,
  enumerable: false
});
