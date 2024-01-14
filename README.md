# Ampere

> [!CAUTION]  
> Ampere hasn't been released yet and is still unstable. Refrain from using it ouside of testing and development purposes.

## Installation

Ampere hasn't been officially released yet so NPM installations will need to be done through GitHub.

```bash
# For npm
npm install git+https://github.com/cohenerickson/Ampere.git
# For pnpm
pnpm install git+https://github.com/cohenerickson/Ampere.git
# For yarn
yarn install git+https://github.com/cohenerickson/Ampere.git
```

## Basic setup using ExpressJS

```ts
import { amperePath } from "ampere";
import express from "express";

const app = express();

app.use(express.static("public"));
app.use("/ampere", express.static(amperePath));

app.listen(3000);
```

## Customization

### Basic Configuration

Ampere has a basic configuration file just like many other proxies, it allows for the modification of the prefix, server, file locations, encoding, and more.

```ts
const config: Config = {
  prefix: "/~/",
  server: "https://tomp.app/",
  logLevel: 0,
  codec: {
    encode: (value: string) => btoa(value),
    decode: (value: string) => atob(value)
  },
  files: {
    directory: "/ampere/",
    config: "config.js",
    client: "client.js",
    worker: "worker.js",
    bundle: "bundle.js"
  },
  plugins: []
};

Object.defineProperty(Object.prototype, "__$ampere", {
  value: Object.assign(globalThis.__$ampere || {}, { config }),
  configurable: false,
  enumerable: false
});
```

> [!IMPORTANT]  
> **ALL** config files must include this code at the bottom, without it Ampere won't be able to detect your config.
>
> ```ts
> Object.defineProperty(Object.prototype, "__$ampere", {
>   value: Object.assign(globalThis.__$ampere || {}, { config }),
>   configurable: false,
>   enumerable: false
> });
> ```

### Using the Plugin API

Ampere also supports a relatively advanced plugin API. This API can do almost anything you wish.

Plugins can run scripts on both the client and the worker they allow for modifications of core behavor and allow for new features to be implemented.

#### Client Plugins

Client plugins have access to the non-proxied window context which allows them to easily extend the functionality and support of websites.

```ts
const plugin: Plugin = {
  name: "Client Plugin Example",
  version: "1.0.0",
  description: "Example client plugin which modifies the user-agent",
  client(window: Window & typeof globalThis) {
    Object.defineProperty(window.navigator, "userAgent", {
      value: "Some UA"
    });
  }
};
```

#### Worker Plugins

Plugins also support modifications on the Service-Worker through an extensive event system.

```ts
const plugin: Plugin = {
  name: "Worker Plugin Example",
  version: "1.0.0",
  description: "Example worker plugin which modifies the user-agent",
  worker(worker: AmpereWorker) {
    worker.on("request", (req: Request) => {
      req.headers.set("User-Agent", "Some UA");
    });
  }
};
```

#### Worker Events

- `request` takes a callback with one parameter of type `Request`. This request can be modified to change the behavor of requests. Returning a new request will override the old one.
- `response` takes a callback with one parameter of type `Response`. This callback behaves the same as the request callback but with a `Response` object instead.
- `pre:html` takes a callback with one parameter of type `string`. This string is the HTML content **before** the Ampere HTML rewriter is run. Returning a different string will modify the value passed to the Ampere HTML rewriter.
- `post:html` takes a callback with one parameter of type `string`. This string is the HTML content **after** the Ampere HTML rewriter is run. Returning a different string will modify the **response** body of requests.
- `pre:css` behaves the same as `pre:html` but for CSS.
- `post:css` behaves the same as `post:html` but for CSS.
- `pre:js` behaves the same as `pre:html` and `pre:css` but for JS.
- `post:js` behaves the same as `post:html` and `pre:css` but for JS.
- `pre:manifest` behaves the same as other events prefixed with `pre:` but for Web Manifests.
- `post:manifest` behaves the same as other events prefixed with `post:` but for Web Manifests.

> [!NOTE]  
> Pre-post rewriting events without the prefix will default to pre-rewriting events
>
> Example: An event with the name of `js` will be handled as if it were `pre:js`

### Extending AmpereWorker

Dispite the advanced plugin API, there are still limitations, that's why we allow you to easily extend the `AmpereWorker` class.

```ts
class MyWorker extends AmpereWorker {
  async makeRequest(url: URL, init: RequestInit): Promise<Response> {
    __$ampere.logger.info("Fetching", url.href);

    // do some logic

    return await __$ampere.bareClient.fetch(url, init);
  }
}
```
