import { Plugin } from "./plugins";
import { uri, Codec } from "./util/codec";

export enum LogLevel {
  None,
  Error,
  Warn,
  Info,
  Debug
}

// Limitations in ESBuild tree shaking cause this file to include all codecs,
// I would reccomend manually creating a config file for production use rather
// than using the built in one.
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
  plugins: []
};

export type Config = {
  prefix: `/${string}/` | "/";
  /**
   * Note: A bare server must support version 3
   */
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
