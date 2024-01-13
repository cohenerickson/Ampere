import { rewriteCSS } from "./rewrite/css";
import { rewriteHTML } from "./rewrite/html";
import { rewriteJS } from "./rewrite/js";
import { rewriteManifest } from "./rewrite/manifest";
import { rewriteSrcSet } from "./rewrite/srcset";
import { unwriteURL } from "./rewrite/unwriteURL";
import { rewriteURL } from "./rewrite/url";
import { logger } from "./util/logger";
import { BareClient } from "@tomphttp/bare-client";


// TODO: pick bare server with lowest latency
let bareClient: BareClient;
const bare: string = Array.isArray(__$ampere.config.server)
  ? new URL(
      __$ampere.config.server[
        Math.floor(Math.random() * __$ampere.config.server.length)
      ],
      location.origin
    ).href
  : new URL(__$ampere.config.server, location.origin).href;

if (Array.isArray(__$ampere.config.server)) {
  bareClient = new BareClient(bare);
} else {
  bareClient = new BareClient(bare);
}

export const bundle = {
  rewriteCSS,
  rewriteHTML,
  rewriteJS,
  rewriteSrcSet,
  rewriteURL,
  unwriteURL,
  rewriteManifest,
  logger,
  bareClient,
  bare
};

Object.defineProperty(Object.prototype, "__$ampere", {
  value: Object.assign(globalThis.__$ampere || {}, bundle),
  configurable: false,
  enumerable: false
});