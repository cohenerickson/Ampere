import "./api/HTMLElement";
import "./pluginLoader";
import { scope } from "./scope";

Object.defineProperty(Object.prototype, "__$ampere", {
  value: Object.assign(globalThis.__$ampere || {}, { scope }),
  configurable: false,
  enumerable: false
});
