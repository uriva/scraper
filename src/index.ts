import {
  always,
  cond,
  empty,
  equals,
  filter,
  head,
  identity,
  length,
  map,
  pipe,
  reduce,
  replace,
  trim,
} from "npm:gamla";
import { HTMLElement, NodeType, TextNode, parse } from "npm:node-html-parser";

type JsonTreeNode = null | string | JsonTreeNode[];

const clean = replace(/\s+/g, " ");

const handlers: [
  (children: JsonTreeNode[]) => boolean,
  (children: JsonTreeNode[]) => JsonTreeNode,
][] = [
  [
    (arr: JsonTreeNode[]) =>
      arr.every((x) => typeof x === "string") && arr.length > 2,
    reduce(
      (s: string, x: JsonTreeNode) => clean(s) + " " + clean(x as string),
      () => "",
    ),
  ],
  [pipe(length, equals(1)), head],
  [empty<JsonTreeNode>, always(null)],
  [
    (x: JsonTreeNode) => typeof x === "string",
    (x: JsonTreeNode) => (x as string).trim(),
  ],
  [() => true, identity],
];

const isBadNode = (node: HTMLElement) =>
  ["SCRIPT", "STYLE", "NOSCRIPT"].includes(node.tagName);

const convertToTreeNode = (node: TextNode | HTMLElement): JsonTreeNode =>
  node.nodeType === NodeType.TEXT_NODE
    ? node.innerText.trim() && node.innerText.trim() !== "&nbsp;"
      ? clean(node.innerText.trim())
      : null
    : isBadNode(node as HTMLElement)
    ? null
    : pipe(
        map(convertToTreeNode),
        filter((x: JsonTreeNode) => x),
        cond(handlers),
      )(node.childNodes as (TextNode | HTMLElement)[]);

export const simplifyHtml = pipe((x) => parse(x, {}), convertToTreeNode);
