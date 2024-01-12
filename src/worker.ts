/// <reference lib="webworker" />
import { Config } from "./config";
import { TypedEmitter } from "./util/TypedEmitter";
import { BareClient } from "@tomphttp/bare-client";

interface SWEvents {
  request: (req: Request) => Request | Promise<Request | void> | void;
  response: (res: Response) => Promise<void> | void;
  html: (html: string) => string | Promise<string | void> | void;
  css: (css: string) => string | Promise<string | void> | void;
  js: (js: string) => string | Promise<string | void> | void;
  manifest: (manifest: string) => string | Promise<string | void> | void;
}

declare var self: ServiceWorkerGlobalScope & {
  AmpereWorker: typeof AmpereWorker;
};

export class AmpereWorker extends TypedEmitter<SWEvents> {
  ready: Promise<void>;
  bare: BareClient;
  config: Config;

  constructor() {
    super();

    this.config = __$ampere.config;

    for (const plugin of this.config.plugins) {
      try {
        if (plugin.worker) {
          __$ampere.logger.info("Loading plugin", plugin.name);
          plugin.worker(this);
          __$ampere.logger.info("Loaded plugin", plugin.name);
        }
      } catch (e) {
        __$ampere.logger.error("Failed to load plugin", plugin.name, "\n", e);
      }
    }

    // TODO: connect to server with lowest latency
    this.bare = __$ampere.bareClient;

    // For now we just resolve immediately
    // eventually we will need to open IDB connections and such
    this.ready = Promise.resolve();

    self.addEventListener("install", () => {
      __$ampere.logger.info("Service Worker installed");
    });
  }

  async fetch(event: FetchEvent): Promise<Response> {
    // wait for the SW to be ready
    await this.ready;

    // allow any internal scripts to load
    const ampereUrls = [
      this.config.files.config,
      this.config.files.client,
      this.config.files.worker,
      this.config.files.bundle
    ].map((file) => this.config.files.directory + file);

    const url = new URL(event.request.url);

    // If the request is for a ampere file, we just fetch it
    if (ampereUrls.includes(url.pathname)) {
      __$ampere.logger.info("Loading ampere script", url.href);
      return fetch(event.request);
    }

    // Otherwise we proxy the request to the server
    const rawProxyURL =
      __$ampere.unwriteURL(url.pathname) + url.search + url.hash;

    // If the URL contains a hash or search (non-encoded data) we redirect to the encoded URL
    if (url.search || url.hash) {
      __$ampere.logger.debug(
        "Detected non-encoded data in URL, redirecting from",
        url.href,
        "to",
        __$ampere.rewriteURL(rawProxyURL, url)
      );

      return new Response(null, {
        status: 301,
        headers: {
          location: __$ampere.rewriteURL(rawProxyURL, url)
        }
      });
    }

    // error checking on URL
    try {
      new URL(rawProxyURL);
    } catch {
      __$ampere.logger.error("Decoded URL is invalid", rawProxyURL);
      return new Response("Invalid URL", { status: 400 });
    }

    const proxyURL = new URL(rawProxyURL);

    // request init for outgoing bare request
    const requestInit: RequestInit & { duplex: "half" } = {
      method: event.request.method,
      headers: Object.fromEntries(event.request.headers),
      redirect: "manual",
      // Typescript doesn't believe in duplex but it's required for certain requests (and yes it's in the spec)
      duplex: "half"
    };

    // request body for non-GET/HEAD requests
    if (!["GET", "HEAD"].includes(event.request.method)) {
      requestInit.body = event.request.body;
    }

    // fetch the resource
    return this.getResource(event, proxyURL, requestInit);
  }

  private async getResource(
    event: FetchEvent,
    url: URL,
    init: RequestInit & { duplex: "half" }
  ) {
    __$ampere.logger.info("Fetching", url.href);

    // create a request object
    let request = new Request(url, init);
    const requestHeaders = new Headers(init.headers);

    // make headers mutable
    Object.defineProperty(request, "headers", {
      get() {
        return requestHeaders;
      }
    });

    // emit request event
    request = (await this.emit("request", request)) ?? request;

    // make a request to the server
    const bareRequest = await this.bare.fetch(request);

    // handle redirects
    if (
      bareRequest.status >= 300 &&
      bareRequest.status < 400 &&
      bareRequest.headers.has("location")
    ) {
      __$ampere.logger.debug(
        "Redirecting from",
        url.href,
        "to",
        bareRequest.headers.get("location")
      );

      return new Response(null, {
        status: 301,
        headers: {
          location: __$ampere.rewriteURL(
            bareRequest.headers.get("location") as string,
            url
          )
        }
      });
    }

    // response init for outgoing response
    const responseInit: ResponseInit = {
      status: bareRequest.status,
      statusText: bareRequest.statusText,
      headers: bareRequest.headers
    };

    let responseBody: BodyInit | null;
    if ([101, 204, 205, 304].includes(bareRequest.status)) {
      // null response body for certain status codes
      responseBody = null;
      __$ampere.logger.info("Returning empty response for", url.href);
    } else if (bareRequest.headers.get("content-type")?.includes("text/html")) {
      __$ampere.logger.info("Rewriting HTML for", url.href);
      // Scope HTML
      let html = await bareRequest.text();

      // emit html event
      html = (await this.emit("html", html)) ?? html;

      responseBody = __$ampere.rewriteHTML(html, url);
    } else if (
      bareRequest.headers
        .get("content-type")
        ?.includes("application/javascript") ||
      // use || destination for non-strict mime type matching
      ["script", "sharedworker", "worker"].includes(event.request.destination)
    ) {
      __$ampere.logger.info("Rewriting JS for", url.href);
      // rewrite JS
      let js = await bareRequest.text();

      // emit js event
      js = (await this.emit("js", js)) ?? js;

      responseBody = __$ampere.rewriteJS(js, url);
    } else if (
      bareRequest.headers.get("content-type")?.includes("text/css") ||
      // use || destination for non-strict mime type matching
      ["style"].includes(event.request.destination)
    ) {
      __$ampere.logger.info("Rewriting CSS for", url.href);
      // rewrite CSS
      let css = await bareRequest.text();

      // emit css event
      css = (await this.emit("css", css)) ?? css;

      responseBody = __$ampere.rewriteCSS(css, url);
    } else if (event.request.destination === "manifest") {
      let manifest = await bareRequest.text();

      // emit manifest event
      manifest = (await this.emit("manifest", manifest)) ?? manifest;

      responseBody = __$ampere.rewriteManifest(manifest, url);
    } else {
      __$ampere.logger.info("Returning binary for", url.href);
      responseBody = bareRequest.body;
    }

    let response = new Response(responseBody, responseInit);

    // emit response event
    response = (await this.emit("response", response)) ?? response;

    return response;
  }
}

self.AmpereWorker = AmpereWorker;
