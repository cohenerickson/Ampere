import { rewriteURL } from "./url";
import { parse } from "acorn-loose";
import { generate } from "astring";
import { BaseCallExpression, CallExpression, Node } from "estree";
import { walk } from "estree-walker";

const GLOBAL_VARS = [
  "location",
  "window",
  "top",
  "parent",
  "opener",
  "eval",
  "self",
  "this",
  "globalThis",
  "localStorage",
  "sessionStorage",
  "postMessage"
];

export function rewriteJS(js: string, scope: string | URL): string {
  // error-tolerant parsing configuration
  const ast = parse(js, {
    sourceType: "module",
    allowImportExportEverywhere: true,
    allowAwaitOutsideFunction: true,
    allowReturnOutsideFunction: true,
    allowSuperOutsideMethod: true,
    checkPrivateFields: false,
    locations: false,
    ranges: false,
    ecmaVersion: "latest",
    preserveParens: false,
    allowReserved: true
  }) as Node;

  walk(ast, {
    leave(node, parent, prop, index) {
      if (node.type === "ImportDeclaration") {
        // rewrite static imports now
        if (typeof node.source.value === "string") {
          node.source.value = rewriteURL(node.source.value, scope);
        }
      } else if (node.type === "ImportExpression") {
        // rewrite dynamic imports during runtime
        node.source = createScopedExpression(
          [node.source, { type: "Literal", value: scope.toString() }],
          "rewriteURL"
        );
      } else if (node.type === "Identifier") {
        // rewrite global variables
        if (
          GLOBAL_VARS.includes(node.name) &&
          ![
            "ArrowFunctionExpression",
            "FunctionDeclaration",
            "LabeledStatement",
            "CatchClause",
            "VariableDeclarator",
            "ExpressionStatement",
            "Property",
            "SequenceExpression",
            "ClassDeclaration",
            "ForInStatement",
            "ForOfStatement",
            "ForStatement"
          ].includes(parent?.type as string)
        ) {
          // Preserve global variables in object definitions and left hand assignments
          if (parent?.type === "MemberExpression" && prop !== "object") return;
          if (parent?.type === "AssignmentExpression" && prop !== "right")
            return;

          this.replace(createScopedExpression([node]));
        }
      } else if (node.type === "Property") {
        if (
          node.value.type === "Identifier" &&
          GLOBAL_VARS.includes(node.value.name)
        ) {
          // Rewrite object definitions with global variables as key shorthands
          node.shorthand = false;

          // Rewrite object definitions with global variables as values
          node.value = createScopedExpression([node.value]);
        }
      }
    }
  });

  return generate(ast);
}

function createScopedExpression(
  args: BaseCallExpression["arguments"],
  name: string = "scope"
): CallExpression {
  return {
    type: "CallExpression",
    callee: {
      type: "Identifier",
      name: `this.__$ampere.${name}`
    },
    arguments: args,
    optional: false
  };
}
