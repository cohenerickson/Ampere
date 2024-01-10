import { bundle } from "./bundle";
import { Config } from "./config";

declare global {
  type AmpereGlobal = typeof bundle & {
    config: Config;
  };

  interface Object {
    __$ampere: AmpereGlobal;
  }

  var __$ampere: AmpereGlobal;
}
