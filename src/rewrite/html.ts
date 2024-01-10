import { rewriteNode } from "./node";
import { parse, serialize } from "parse5";

export function rewriteHTML(html: string): string {
  const document = parse(html);
  const config = __$ampere.config;

  for (const node of document.childNodes) {
    rewriteNode(node);
  }

  return `
    ${/* Handle JS quirks mode */ ""}
    ${/^<!DOCTYPE html>/i.test(html) && "<!DOCTYPE html>"}
    <head>
      ${/* Inject proxy scripts */ ""}
      <script src="${config.files.directory + config.files.config}"></script>
      <script src="${config.files.directory + config.files.bundle}"></script>
      <script src="${config.files.directory + config.files.client}"></script>
    </head>
    ${serialize(document)}
  `;
}
