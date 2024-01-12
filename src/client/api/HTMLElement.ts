import { unwriteURL } from "../../rewrite/unwriteURL";

const ATTRIBUTE_FUNCTIONS = [
  "getAttribute",
  "setAttribute",
  "hasAttribute",
  "removeAttribute",
  "getAttributeNode",
  "setAttributeNode",
  "removeAttributeNode",
  "getAttributeNames"
] as const;

const ATTRIBUTE_REWRITES = {
  href: [HTMLAnchorElement, HTMLLinkElement, HTMLAreaElement, HTMLBaseElement],
  src: [
    HTMLAudioElement,
    HTMLEmbedElement,
    HTMLIFrameElement,
    HTMLImageElement,
    HTMLInputElement,
    HTMLScriptElement,
    HTMLSourceElement,
    HTMLTrackElement,
    HTMLVideoElement
  ],
  srcdoc: [HTMLIFrameElement],
  srcset: [HTMLImageElement, HTMLSourceElement],
  action: [HTMLFormElement],
  poster: [HTMLVideoElement],
  formaction: [HTMLButtonElement],
  data: [HTMLObjectElement],
  background: [HTMLBodyElement],
  integrity: [HTMLScriptElement, HTMLLinkElement],
  nonce: [HTMLElement]
} as const;

export const attributes = Object.fromEntries(
  ATTRIBUTE_FUNCTIONS.map(
    (
      ATTRIBUTE_FUNCTION
    ): [typeof ATTRIBUTE_FUNCTION, PropertyDescriptor["value"]] => {
      return [
        ATTRIBUTE_FUNCTION,
        Object.getOwnPropertyDescriptor(Element.prototype, ATTRIBUTE_FUNCTION)
          ?.value
      ];
    }
  )
) as {
  [key in (typeof ATTRIBUTE_FUNCTIONS)[number]]: PropertyDescriptor["value"];
};

const INNER_HTML = Object.getOwnPropertyDescriptor(
  Element.prototype,
  "innerHTML"
);

Object.defineProperties(Element.prototype, {
  innerHTML: {
    get() {
      return INNER_HTML?.get?.call(this);
    },
    set(value: string) {
      return INNER_HTML?.set?.call(
        this,
        __$ampere.rewriteHTML(value, __$ampere.base)
      );
    }
  },
  getAttribute: {
    value: function (attribute: string) {
      if (/^_/.test(attribute)) {
        return attributes.getAttribute.call(this, `_${attribute}`);
      } else if (attributes.hasAttribute.call(this, `_${attribute}`)) {
        return attributes.getAttribute.call(this, `_${attribute}`);
      }
      return attributes.getAttribute.call(this, attribute);
    }
  },
  setAttribute: {
    value: function (attribute: string, value: string) {
      if (attribute.startsWith("on")) {
        return attributes.setAttribute.call(
          this,
          attribute,
          __$ampere.rewriteJS(value, __$ampere.base)
        );
      } else if (/^_/.test(attribute)) {
        return attributes.setAttribute.call(this, `_${attribute}`, value);
      }
      return attributes.setAttribute.call(this, attribute, value);
    }
  },
  hasAttribute: {
    value: function (attribute: string) {
      if (/^_/.test(attribute)) {
        return attributes.hasAttribute.call(this, `_${attribute}`);
      } else if (attributes.hasAttribute.call(this, `_${attribute}`)) {
        return true;
      } else {
        return attributes.hasAttribute.call(this, attribute);
      }
    }
  },
  removeAttribute: {
    value: function (attribute: string) {
      if (/^_/.test(attribute)) {
        return attributes.removeAttribute.call(this, `_${attribute}`);
      } else if (attributes.hasAttribute.call(this, `_${attribute}`)) {
        return attributes.removeAttribute.call(this, `_${attribute}`);
      }
      return attributes.removeAttribute.call(this, attribute);
    }
  },
  getAttributeNode: {
    value: function (attribute: string) {
      if (/^_/.test(attribute)) {
        return attributes.getAttributeNode.call(this, `_${attribute}`);
      } else if (attributes.hasAttribute.call(this, `_${attribute}`)) {
        const attr = attributes.getAttributeNode.call(this, `_${attribute}`);
        if (!attr) return null;
        return new Proxy(attr, {
          get: function (target, prop: keyof Attr) {
            if (["name", "localName", "nodeName"].includes(prop)) {
              return target.name.replace(/^_/, "");
            }
            return target[prop];
          }
        });
      }
      return attributes.getAttributeNode.call(this, attribute);
    }
  },
  setAttributeNode: {
    value: function (attribute: Attr) {
      if (/^on[a-z]+/i.test(attribute.name)) {
        return attributes.setAttribute.call(
          this,
          attribute.name,
          __$ampere.rewriteJS(attribute.value, __$ampere.base)
        );
      } else if (/^_/.test(attribute.name)) {
        return attributes.setAttribute.call(
          this,
          `_${attribute}`,
          attribute.value
        );
      }
      return attributes.setAttributeNode.call(this, attribute);
    }
  },
  removeAttributeNode: {
    value: function (attribute: Attr) {
      if (/^_/.test(attribute.name)) {
        return attributes.removeAttribute.call(this, `_${attribute.name}`);
      } else if (attributes.hasAttribute.call(this, `_${attribute.name}`)) {
        attributes.removeAttribute.call(this, attribute.name);
        return attributes.removeAttribute.call(this, `_${attribute.name}`);
      }
      return attributes.removeAttributeNode.call(this, attribute);
    }
  },
  getAttributeNames: {
    value: function () {
      let attributeNames = attributes.getAttributeNames.call(this) as string[];
      attributeNames = attributeNames.map((attribute) => {
        if (/^_/.test(attribute)) {
          return attribute.replace(/^_/, "");
        }
        return attribute;
      });
      return Array.from(new Set(attributeNames));
    }
  }
});

Object.entries(ATTRIBUTE_REWRITES).forEach(([property, elements]) => {
  elements.forEach((element: typeof HTMLElement) => {
    const { get, set } =
      Object.getOwnPropertyDescriptor(element.prototype, property) ?? {};
    if (!get || !set) return;
    Object.defineProperty(element.prototype, property, {
      get() {
        if (property === "href" || property === "src") {
          return unwriteURL(this.getAttribute(property));
        }
        return get.call(this);
      },
      set(value) {
        if (property === "href" || property === "src") {
          return this.setAttribute(
            property,
            __$ampere.rewriteURL(value, __$ampere.base)
          );
        } else if (property === "integrity") {
          return attributes.setAttribute.call(this, `_${property}`, value);
        } else if (property === "srcdoc") {
          attributes.setAttribute.call(
            this,
            `srcdoc`,
            __$ampere.rewriteHTML(value, __$ampere.base)
          );
          return attributes.setAttribute.call(this, `_${property}`, value);
        }
        return set.call(this, value);
      }
    });
  });
});
