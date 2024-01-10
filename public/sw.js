importScripts("/ampere/bundle.js", "/ampere/config.js");
importScripts("/ampere/worker.js");

const ampere = new AmpereWorker();

self.addEventListener("fetch", (event) => {
  event.respondWith(ampere.fetch(event));
});
