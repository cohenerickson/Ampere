Object.defineProperty(navigator, "serviceWorker", {
  get() {
    return undefined;
  }
});

Object.defineProperty(Navigator.prototype, "serviceWorker", {
  get() {
    return undefined;
  }
});
