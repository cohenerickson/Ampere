import { bundle } from "./bundle";
import { scope } from "./client/scope";
import { Config } from "./config";

declare global {
  type AmpereGlobal = typeof bundle & {
    config: Config;
    scope: typeof scope;
    base: string;
    cookie: string;
  };

  var __$ampere: AmpereGlobal;

  interface Object {
    __$ampere: AmpereGlobal;
  }
}
