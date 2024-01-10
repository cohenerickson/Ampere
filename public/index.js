if ("serviceWorker" in navigator) {
  console.log("Registering service worker");
  navigator.serviceWorker.register("/sw.js", {
    scope: __$ampere.config.prefix
  });
}

const input = document.querySelector("input");
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    let url = input.value;

    if (/^https?:\/\/(\S+\.)+\S+/.test(url)) {
      url = url;
    } else if (/^(\S+\.)+\S+/.test(url)) {
      url = `https://${url}`;
    } else {
      url = `https://www.google.com/search?q=${url}`;
    }

    location.href = `${__$ampere.config.prefix}${__$ampere.config.codec.encode(
      url
    )}`;
  }
});
