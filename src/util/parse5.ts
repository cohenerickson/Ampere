import {
  query,
  getAttribute,
  removeAttribute,
  setAttribute
} from "@parse5/tools";
import { Node, Element } from "parse5/dist/tree-adapters/default";

export function getBase(node: Node, meta: string | URL): string {
  const base = query(
    node,
    (node) => node.nodeName === "base"
  ) as Element | null;

  if (base) {
    const href = getAttribute(base, "href");

    if (href) {
      meta = new URL(href, meta).toString();

      setAttribute(base, "_href", href);
      removeAttribute(base, "href");
    }
  }

  return meta.toString();
}
