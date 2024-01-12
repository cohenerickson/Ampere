import { rewriteCSS } from "./rewrite/css";
import { rewriteHTML } from "./rewrite/html";
import { rewriteJS } from "./rewrite/js";
import { rewriteManifest } from "./rewrite/manifest";
import { rewriteSrcSet } from "./rewrite/srcset";
import { unwriteURL } from "./rewrite/unwriteURL";
import { rewriteURL } from "./rewrite/url";
import { logger } from "./util/logger";
import { BareClient } from "@tomphttp/bare-client";

const bareClient: BareClient = new BareClient(
  new URL(
    Array.isArray(__$ampere.config.server)
      ? __$ampere.config.server[
          Math.floor(Math.random() * __$ampere.config.server.length)
        ]
      : __$ampere.config.server,
    location.origin
  )
);

export const bundle = {
  rewriteCSS,
  rewriteHTML,
  rewriteJS,
  rewriteSrcSet,
  rewriteURL,
  unwriteURL,
  rewriteManifest,
  logger,
  bareClient
};

Object.defineProperty(Object.prototype, "__$ampere", {
  value: Object.assign(globalThis.__$ampere || {}, bundle),
  configurable: false,
  enumerable: false
});
