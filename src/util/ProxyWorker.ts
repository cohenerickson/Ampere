import { TypedEmitter } from "./TypedEmitter";

export interface WorkerEvents {
  request: (req: Request) => Request | Promise<Request | void> | void;
  response: (res: Response) => Promise<void> | void;
  html: (html: string) => string | Promise<string | void> | void;
  css: (css: string) => string | Promise<string | void> | void;
  js: (js: string) => string | Promise<string | void> | void;
  manifest: (manifest: string) => string | Promise<string | void> | void;
}

export abstract class ProxyWorker extends TypedEmitter<WorkerEvents> {
  abstract ready: Promise<void>;

  abstract fetch(event: FetchEvent): Promise<Response>;

  abstract makeRequest(url: URL, init: RequestInit): Promise<Response>;
}
