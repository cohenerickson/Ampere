import { Plugin } from "./plugins";
import { DisableCSP } from "./plugins/DisableCSP";
import { uri, Codec } from "./util/codec";

export enum LogLevel {
  None,
  Error,
  Warn,
  Info,
  Debug
}

export const config: Config = {
  prefix: "/~/",
  server: "http://localhost:8080/",
  logLevel: LogLevel.Debug,
  codec: uri,
  files: {
    directory: "/ampere/",
    config: "config.js",
    client: "client.js",
    worker: "worker.js",
    bundle: "bundle.js"
  },
  plugins: [DisableCSP()]
};

export type Config = {
  prefix: `/${string}/` | "/";
  server: (string | URL) | (string | URL)[];
  logLevel: LogLevel;
  codec: Codec;
  files: {
    directory: `/${string}/` | "/";
    config: `${string}.js`;
    client: `${string}.js`;
    worker: `${string}.js`;
    bundle: `${string}.js`;
  };
  plugins: Plugin[];
};

Object.defineProperty(Object.prototype, "__$ampere", {
  value: Object.assign(globalThis.__$ampere || {}, { config }),
  configurable: false,
  enumerable: false
});
