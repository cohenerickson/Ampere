import { Node, Element } from "parse5/dist/tree-adapters/default";

export function getBase(node: Node, scope: string | URL): string {
  let base: Element | undefined;

  walk(node, {
    enter(node) {
      if (
        node.nodeName === "base" &&
        node.attrs.length === 1 &&
        node.attrs[0].name === "href"
      ) {
        base = node;
      }
    }
  });

  if (base) {
    const href = base.attrs.find((attr) => attr.name === "href")?.value;

    if (href) {
      scope = new URL(href, scope).toString();
      base.attrs = base.attrs.filter((attr) => attr.name !== "href");
    }
  }

  return scope.toString();
}

type Handler = (
  node: Node | Element,
  parent: Node | null,
  index: number
) => void;

export function walk(
  node: Node,
  { enter, leave }: { enter?: Handler; leave?: Handler },
  parent: Node | null = null,
  i = 0
) {
  if (enter) enter(node, parent, i);

  if ("childNodes" in node) {
    for (let i = 0; i < node.childNodes.length; i++) {
      const child = node.childNodes[i];
      walk(child, { enter, leave }, node, i);
    }
  }

  if ("content" in node) {
    for (let i = 0; i < node.content.childNodes.length; i++) {
      const child = node.content.childNodes[i];
      walk(child, { enter, leave }, node, i);
    }
  }

  if (leave) leave(node, parent, i);
}
