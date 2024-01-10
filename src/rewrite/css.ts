import { rewriteURL } from "./url";
import { parse, walk, generate, CssNode, AtrulePrelude } from "css-tree";

export function rewriteCSS(css: string, meta: string | URL): string {
  const ast = parse(css);

  walk(ast, {
    enter(node: CssNode) {
      if (node.type === "Url") {
        node.value = rewriteURL(node.value, meta);
      }

      if (node.type === "Atrule" && node.name === "import") {
        (node.prelude as AtrulePrelude).children.forEach((child: CssNode) => {
          if (child.type === "String") {
            child.value = rewriteURL(child.value, meta);
          }
        });
      }
    }
  });

  return generate(ast);
}
