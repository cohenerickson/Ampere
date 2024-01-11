import { Plugin } from ".";

export function ForceTheme(theme: "light" | "dark"): Plugin {
  return {
    name: "ForceTheme",
    version: "1.0.0",
    description: "Forces websites to use a certain theme.",
    worker(worker) {
      worker.on("css", (css) => {
        return css
          .replace(
            RegExp(`\\(prefers-color-scheme: ?${theme}\\)`, "g"),
            "(width >= 0)"
          )
          .replace(
            RegExp(
              `\\(prefers-color-scheme: ?${
                theme === "dark" ? "light" : "dark"
              }\\)`,
              "g"
            ),
            "(width < 0)"
          );
      });
    },
    client(window) {
      const matchMedia = window.matchMedia;

      window.matchMedia = (query): MediaQueryList => {
        const newQuery = query
          .replace(
            RegExp(`\\(prefers-color-scheme: ?${theme}\\)`, "g"),
            "(width >= 0)"
          )
          .replace(
            RegExp(
              `\\(prefers-color-scheme: ?${
                theme === "dark" ? "light" : "dark"
              }\\)`,
              "g"
            ),
            "(width < 0)"
          );

        const queryList = matchMedia(query);

        if (queryList.media === newQuery) {
          Object.defineProperty(queryList, "media", {
            get() {
              return query;
            }
          });
        }

        return queryList;
      };
    }
  };
}
