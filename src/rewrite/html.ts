import { getBase, walk } from "../util/parse5";
import { rewriteCSS } from "./css";
import { rewriteJS } from "./js";
import { rewriteSrcSet } from "./srcset";
import { rewriteURL } from "./url";
import { parse, serialize } from "parse5";
import { TextNode } from "parse5/dist/tree-adapters/default";

const JAVASCRIPT_ELEMENTS = ["script"] as const;
const CSS_ELEMENTS = ["style"] as const;

const HREF_ELEMENTS = ["link", "a", "area"] as const;
const SRC_ELEMENTS = [
  "audio",
  "embed",
  "iframe",
  "img",
  "input",
  "script",
  "source",
  "track",
  "video"
] as const;
const SRCDOC_ELEMENTS = ["iframe"] as const;
const SRCSET_ELEMENTS = ["img", "source"] as const;
const ACTION_ELEMENTS = ["form"] as const;
const POSTER_ELEMENTS = ["video"] as const;
const FORMACTION_ELEMENTS = ["button"] as const;
const DATA_ELEMENTS = ["object"] as const;
const BACKGROUND_ELEMENTS = ["body"] as const;
const INTEGRITY_ELEMENTS = ["link", "script"] as const;
const NONCE_ELEMENTS = ["script", "style"] as const;

declare global {
  interface ReadonlyArray<T> {
    includes(searchElement: any, fromIndex?: number): searchElement is T;
  }
}

export function rewriteHTML(html: string, scope: string | URL): string {
  const document = parse(html);

  const base = getBase(document, scope);

  walk(document, {
    leave(node) {
      // Fix weak native typing of .includes
      if (!("attrs" in node)) return;

      // Inline scripts
      if (JAVASCRIPT_ELEMENTS.includes(node.nodeName)) {
        const textNode = node.childNodes[0] as TextNode;

        if (textNode) {
          textNode.value = rewriteJS(textNode.value, scope);
        }
      }

      // Inline styles
      if (CSS_ELEMENTS.includes(node.nodeName)) {
        const textNode = node.childNodes[0] as TextNode;

        if (textNode) {
          textNode.value = rewriteCSS(textNode.value, scope);
        }
      }

      // HREF attributes
      if (HREF_ELEMENTS.includes(node.nodeName)) {
        const href = node.attrs.find((attr) => attr.name === "href");

        if (href) {
          href.value = rewriteURL(href.value, scope);
        }
      }

      // SRC attributes
      if (SRC_ELEMENTS.includes(node.nodeName)) {
        const src = node.attrs.find((attr) => attr.name === "src");

        if (src) {
          src.value = rewriteURL(src.value, scope);
        } else {
          const textNode = node.childNodes[0] as TextNode;

          if (textNode) {
            textNode.value = rewriteJS(textNode.value, scope);
          }
        }
      }

      // SRCDOC attributes
      if (SRCDOC_ELEMENTS.includes(node.nodeName)) {
        const srcdoc = node.attrs.find((attr) => attr.name === "srcdoc");

        if (srcdoc) {
          srcdoc.value = rewriteHTML(srcdoc.value, scope);
        }
      }

      // SRCSET attributes
      if (SRCSET_ELEMENTS.includes(node.nodeName)) {
        const srcset = node.attrs.find((attr) => attr.name === "srcset");

        if (srcset) {
          srcset.value = rewriteSrcSet(srcset.value, scope);
        }
      }

      // ACTION attributes
      if (ACTION_ELEMENTS.includes(node.nodeName)) {
        const action = node.attrs.find((attr) => attr.name === "action");

        if (action) {
          action.value = rewriteURL(action.value, scope);
        }
      }

      // POSTER attributes
      if (POSTER_ELEMENTS.includes(node.nodeName)) {
        const poster = node.attrs.find((attr) => attr.name === "poster");

        if (poster) {
          poster.value = rewriteURL(poster.value, scope);
        }
      }

      // FORMACTION attributes
      if (FORMACTION_ELEMENTS.includes(node.nodeName)) {
        const formaction = node.attrs.find(
          (attr) => attr.name === "formaction"
        );

        if (formaction) {
          formaction.value = rewriteURL(formaction.value, scope);
        }
      }

      // DATA attributes
      if (DATA_ELEMENTS.includes(node.nodeName)) {
        const data = node.attrs.find((attr) => attr.name === "data");

        if (data) {
          data.value = rewriteURL(data.value, scope);
        }
      }

      // BACKGROUND attributes
      if (BACKGROUND_ELEMENTS.includes(node.nodeName)) {
        const background = node.attrs.find(
          (attr) => attr.name === "background"
        );

        if (background) {
          background.value = rewriteURL(background.value, scope);
        }
      }

      // INTEGRITY attributes
      if (INTEGRITY_ELEMENTS.includes(node.nodeName)) {
        const integrity = node.attrs.find((attr) => attr.name === "integrity");

        if (integrity) {
          node.attrs = node.attrs.map((attr) =>
            attr.name === "integrity" ? { ...attr, name: "integrity" } : attr
          );
        }
      }

      //   // NONCE attributes
      //   if (NONCE_ELEMENTS.includes(node.nodeName)) {
      //     node.attrs = node.attrs.filter((attr) => attr.name !== "nonce");

      //     // TODO: some CSP shit
      //   }
    }
  });

  const files = __$ampere.config.files;
  return (
    // Handle quirks mode
    (/^<!DOCTYPE html>/i.test(html) ? "<!DOCTYPE html>" : "") +
    "<head>" +
    // Inject proxy scripts
    `  <script>Object.defineProperty(Object.prototype,"__$ampere",{value:Object.assign(globalThis.__$ampere||{},{base:"${base}"}),configurable:false,enumerable:false});</script>` +
    `  <script src="${files.directory + files.config}"></script>` +
    `  <script src="${files.directory + files.bundle}"></script>` +
    `  <script src="${files.directory + files.client}"></script>` +
    "</head>" +
    // Serialize rewritten HTML
    serialize(document)
  );
}
