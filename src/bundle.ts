import { rewriteCSS } from "./rewrite/css";
import { rewriteHTML } from "./rewrite/html";
import { rewriteJS } from "./rewrite/js";
import { rewriteSrcSet } from "./rewrite/srcset";
import { rewriteURL } from "./rewrite/url";
import * as codecs from "./util/codec";
import { logger } from "./util/logger";

export const bundle = {
  rewriteCSS,
  rewriteHTML,
  rewriteJS,
  rewriteSrcSet,
  rewriteURL,
  codecs,
  logger
};

Object.defineProperty(Object.prototype, "__$ampere", {
  value: Object.assign(globalThis.__$ampere || {}, bundle),
  configurable: false,
  enumerable: false
});
