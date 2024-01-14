import { TypedEmitter } from "./TypedEmitter";

type EventHandler<T> = (value: T) => T | Promise<T | void> | void;

type EventHandlers<T, N extends string> = {
  [key in N | `pre:${N}` | `post:${N}`]: EventHandler<T>;
};

export type WorkerEvents = {
  request: EventHandler<Request>;
  response: EventHandler<Response>;
} & EventHandlers<string, "html" | "css" | "js" | "manifest">;

export abstract class ProxyWorker extends TypedEmitter<WorkerEvents> {
  abstract ready: Promise<void>;

  abstract fetch(event: FetchEvent): Promise<Response>;

  abstract makeRequest(url: URL, init: RequestInit): Promise<Response>;
}
