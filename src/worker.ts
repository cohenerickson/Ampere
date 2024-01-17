/// <reference lib="webworker" />
import { incoming, outgoing } from "./rewrite/headers";
import { ProxyWorker, WorkerEvents } from "./util/ProxyWorker";
import { TypedEmitter } from "./util/TypedEmitter";

declare var self: ServiceWorkerGlobalScope & {
  AmpereWorker: typeof AmpereWorker;
};

export class AmpereWorker
  extends TypedEmitter<WorkerEvents>
  implements ProxyWorker
{
  ready: Promise<void>;

  constructor() {
    super();

    // Load plugins
    for (const plugin of __$ampere.config.plugins) {
      try {
        if (plugin.worker) {
          __$ampere.logger.info("Loading plugin", plugin.name);
          plugin.worker(this);
          __$ampere.logger.info("Loaded plugin", plugin.name);
        }
      } catch (e) {
        __$ampere.logger.error("Failed to load plugin", plugin.name, e);
      }
    }

    // For now we just resolve immediately
    // eventually we will need to open IDB connections and such
    this.ready = Promise.resolve();

    self.addEventListener("install", () => {
      __$ampere.logger.info("Service Worker installed");
    });
  }

  async makeRequest(url: URL, init: RequestInit): Promise<Response> {
    __$ampere.logger.info("Fetching", url.href, init);

    return await __$ampere.bareClient.fetch(url, init);
  }

  async fetch(event: FetchEvent): Promise<Response> {
    // wait for the SW to be ready
    await this.ready;

    // allow any internal scripts to load
    const { files } = __$ampere.config;
    const ampereUrls = [
      files.config,
      files.client,
      files.worker,
      files.bundle
    ].map((file) => files.directory + file);

    const url = new URL(event.request.url);

    // If the request is for a ampere file, we just fetch it
    if (ampereUrls.includes(url.pathname)) {
      __$ampere.logger.info("Loading ampere script", url.href);
      return fetch(event.request);
    }

    // Otherwise we proxy the request to the server
    const rawProxyURL =
      __$ampere.unwriteURL(url.pathname) + url.search + url.hash;

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

    // create a request object
    let request = new Request(proxyURL, requestInit);
    const requestHeaders: Headers = await outgoing(
      new Headers(requestInit.headers),
      proxyURL
    );

    // make headers mutable
    Object.defineProperty(request, "headers", {
      get() {
        return requestHeaders;
      }
    });

    // emit request event
    request = (await this.emit("request", request)) ?? request;

    // make a request to the server
    const bareRequest = await this.makeRequest(proxyURL, requestInit);

    // handle redirects
    if (
      bareRequest.status >= 300 &&
      bareRequest.status < 400 &&
      bareRequest.headers.has("location")
    ) {
      __$ampere.logger.debug(
        "Redirecting from",
        proxyURL.href,
        "to",
        bareRequest.headers.get("location")
      );

      return new Response(null, {
        status: 301,
        headers: {
          location: __$ampere.rewriteURL(
            bareRequest.headers.get("location") as string,
            proxyURL
          )
        }
      });
    }

    // response init for outgoing response
    const responseInit: ResponseInit = {
      status: bareRequest.status,
      statusText: bareRequest.statusText,
      headers: await incoming(bareRequest.headers, proxyURL)
    };

    let responseBody: BodyInit | null;
    if ([101, 204, 205, 304].includes(bareRequest.status)) {
      // null response body for certain status codes
      responseBody = null;
      __$ampere.logger.info("Returning empty response for", proxyURL.href);
    } else if (bareRequest.headers.get("content-type")?.includes("text/html")) {
      __$ampere.logger.info("Rewriting HTML for", proxyURL.href);
      let html = await bareRequest.text();

      // emit pre:html event
      html = (await this.emit("html", html)) ?? html;
      html = (await this.emit("pre:html", html)) ?? html;

      const cookie = await __$ampere.getCookie(proxyURL);

      // rewrite HTML
      html = __$ampere.rewriteHTML(html, proxyURL, cookie ?? "");

      // emit post:html event
      responseBody = (await this.emit("post:html", html)) ?? html;
    } else if (
      bareRequest.headers
        .get("content-type")
        ?.includes("application/javascript") ||
      // use || destination for non-strict mime type matching
      ["script", "sharedworker", "worker"].includes(event.request.destination)
    ) {
      __$ampere.logger.info("Rewriting JS for", proxyURL.href);
      let js = await bareRequest.text();

      // emit pre:js event
      js = (await this.emit("js", js)) ?? js;
      js = (await this.emit("pre:js", js)) ?? js;

      // rewrite JS
      js = __$ampere.rewriteJS(js, proxyURL);

      // emit post:js event
      responseBody = (await this.emit("post:js", js)) ?? js;
    } else if (
      bareRequest.headers.get("content-type")?.includes("text/css") ||
      // use || destination for non-strict mime type matching
      ["style"].includes(event.request.destination)
    ) {
      __$ampere.logger.info("Rewriting CSS for", proxyURL.href);
      let css = await bareRequest.text();

      // emit pre:css event
      css = (await this.emit("css", css)) ?? css;
      css = (await this.emit("pre:css", css)) ?? css;

      // rewrite CSS
      css = __$ampere.rewriteCSS(css, proxyURL);

      // emit post:css event
      responseBody = (await this.emit("post:css", css)) ?? css;
    } else if (event.request.destination === "manifest") {
      __$ampere.logger.info("Rewriting Manifest for", proxyURL.href);
      let manifest = await bareRequest.text();

      // emit pre:manifest event
      manifest = (await this.emit("manifest", manifest)) ?? manifest;
      manifest = (await this.emit("pre:manifest", manifest)) ?? manifest;

      manifest = __$ampere.rewriteManifest(manifest, proxyURL);

      // emit post:manifest event
      responseBody = (await this.emit("post:manifest", manifest)) ?? manifest;
    } else {
      __$ampere.logger.info("Returning binary for", proxyURL.href);
      responseBody = bareRequest.body;
    }

    let response = new Response(responseBody, responseInit);

    // emit response event
    response = (await this.emit("response", response)) ?? response;

    return response;
  }
}

self.AmpereWorker = AmpereWorker;
