import { map, pipe, removeNulls } from "gamla";
import { HTMLElement, NodeType, TextNode, parse } from "node-html-parser";
type JsonTreeNode = null | string | JsonTreeNode[];

const processArray = (x: JsonTreeNode[]) =>
  x.length === 0 ? null : x.length === 1 ? x[0] : x;

const isBadNode = (node: HTMLElement) =>
  ["SCRIPT", "STYLE", "NOSCRIPT"].includes(node.tagName);

function convertToTreeNode(node: TextNode | HTMLElement): JsonTreeNode {
  return node.nodeType === NodeType.TEXT_NODE
    ? node.text.trim()
      ? node.text.trim()
      : null
    : isBadNode(node as HTMLElement)
    ? null
    : pipe(
        map(convertToTreeNode),
        removeNulls<JsonTreeNode>,
        map(
          (x: string | JsonTreeNode[]): JsonTreeNode =>
            typeof x === "string" ? x : processArray(x),
        ),
        removeNulls<JsonTreeNode>,
      )(node.childNodes as (TextNode | HTMLElement)[]);
}

export const simplifyHtml = pipe(parse, convertToTreeNode);
