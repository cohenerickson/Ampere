import { Plugin } from ".";

export function UserAgent(ua: string): Plugin {
  return {
    name: "UserAgent",
    version: "1.0.0",
    description: "Spoofs the user agent.",
    worker(worker) {
      worker.on("request", (request) => {
        request.headers.set("user-agent", ua);
      });
    },
    client(window) {
      Object.defineProperty(window.navigator, "userAgent", {
        get() {
          return ua;
        }
      });
    }
  };
}
