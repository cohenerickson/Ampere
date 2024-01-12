import { Plugin } from ".";

export function DisableCSP(): Plugin {
  return {
    name: "DisableCSP",
    version: "1.0.0",
    description:
      "Deletes the Content-Security-Policy header. (Full CSP support is planned, this simply bypasses any issues that may occur for now)",
    worker(worker) {
      worker.on("response", (res) => {
        res.headers.delete("content-security-policy");
        res.headers.delete("content-security-policy-report-only");
      });
    }
  };
}
