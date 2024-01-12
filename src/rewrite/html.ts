import { rewriteCSS } from "./css";
import { rewriteJS } from "./js";
import { rewriteSrcSet } from "./srcset";
import { rewriteURL } from "./url";
import {
  traverse,
  query,
  getAttribute,
  removeAttribute,
  setAttribute,
  getTextContent,
  setTextContent,
  Element
} from "@parse5/tools";
import { parse, serialize } from "parse5";
import { Node } from "parse5/dist/tree-adapters/default";

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

export function rewriteHTML(html: string, meta: string | URL): string {
  const document = parse(html);

  const base = query(document, (node) => node.nodeName === "base") as Element;

  if (base) {
    const href = getAttribute(base, "href");

    if (href) {
      meta = new URL(href, meta).toString();

      setAttribute(base, "_href", href);
      removeAttribute(base, "href");
    }
  }

  traverse(document, {
    node(node: Node) {
      // Fix weak native typing of .includes
      if (!("attrs" in node)) return;

      // Inline scripts
      if (JAVASCRIPT_ELEMENTS.includes(node.nodeName)) {
        const type = getAttribute(node, "type");

        if (
          type &&
          !(
            type.startsWith("application/javascript") ||
            type.startsWith("text/javascript") ||
            type === "module"
          )
        )
          return;

        const content = getTextContent(node);

        if (content) setTextContent(node, rewriteJS(content, meta));
      }

      // Inline styles
      if (CSS_ELEMENTS.includes(node.nodeName)) {
        const content = getTextContent(node);

        if (content) setTextContent(node, rewriteCSS(content, meta));
      }

      // HREF attributes
      if (HREF_ELEMENTS.includes(node.nodeName)) {
        const href = getAttribute(node, "href");

        if (href) {
          setAttribute(node, "href", rewriteURL(href, meta));
        }
      }

      // SRC attributes
      if (SRC_ELEMENTS.includes(node.nodeName)) {
        const src = getAttribute(node, "src");

        if (src) {
          setAttribute(node, "src", rewriteURL(src, meta));
        }
      }

      // SRCDOC attributes
      if (SRCDOC_ELEMENTS.includes(node.nodeName)) {
        const srcdoc = getAttribute(node, "srcdoc");

        if (srcdoc) {
          setAttribute(node, "srcdoc", rewriteHTML(srcdoc, meta));
        }
      }

      // SRCSET attributes
      if (SRCSET_ELEMENTS.includes(node.nodeName)) {
        const srcset = getAttribute(node, "srcset");

        if (srcset) {
          setAttribute(node, "srcset", rewriteSrcSet(srcset, meta));
        }
      }

      // ACTION attributes
      if (ACTION_ELEMENTS.includes(node.nodeName)) {
        const action = getAttribute(node, "action");

        if (action) {
          setAttribute(node, "action", rewriteURL(action, meta));
        }
      }

      // POSTER attributes
      if (POSTER_ELEMENTS.includes(node.nodeName)) {
        const poster = getAttribute(node, "poster");

        if (poster) {
          setAttribute(node, "poster", rewriteURL(poster, meta));
        }
      }

      // FORMACTION attributes
      if (FORMACTION_ELEMENTS.includes(node.nodeName)) {
        const formaction = getAttribute(node, "formaction");

        if (formaction) {
          setAttribute(node, "formaction", rewriteURL(formaction, meta));
        }
      }

      // DATA attributes
      if (DATA_ELEMENTS.includes(node.nodeName)) {
        const data = getAttribute(node, "data");

        if (data) {
          setAttribute(node, "data", rewriteURL(data, meta));
        }
      }

      // BACKGROUND attributes
      if (BACKGROUND_ELEMENTS.includes(node.nodeName)) {
        const background = getAttribute(node, "background");

        if (background) {
          setAttribute(node, "background", rewriteURL(background, meta));
        }
      }

      // INTEGRITY attributes
      if (INTEGRITY_ELEMENTS.includes(node.nodeName)) {
        const integrity = getAttribute(node, "integrity");

        if (integrity) {
          setAttribute(node, "_integrity", integrity);
          removeAttribute(node, "integrity");
        }
      }

      // NONCE attributes
      if (NONCE_ELEMENTS.includes(node.nodeName)) {
        const nonce = getAttribute(node, "nonce");

        if (nonce) {
          setAttribute(node, "_nonce", nonce);
          removeAttribute(node, "nonce");
        }
      }
    }
  });

  const files = __$ampere.config.files;
  return (
    // Handle quirks mode
    (/^<!DOCTYPE html>/i.test(html) ? "<!DOCTYPE html>" : "") +
    "<head>" +
    // Inject proxy scripts
    `  <script>Object.defineProperty(Object.prototype,"__$ampere",{value:Object.assign(globalThis.__$ampere||{},{base:"${meta.toString()}"}),configurable:false,enumerable:false});</script>` +
    `  <script src="${files.directory + files.config}"></script>` +
    `  <script src="${files.directory + files.bundle}"></script>` +
    `  <script src="${files.directory + files.client}"></script>` +
    "</head>" +
    // Serialize rewritten HTML
    serialize(document)
  );
}
