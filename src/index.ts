import {
  always,
  cond,
  empty,
  equals,
  filter,
  findInTree,
  head,
  identity,
  length,
  map,
  pipe,
  reduce,
  replace,
  trimWhitesapce,
} from "https://deno.land/x/gamla@39.0.0/src/index.ts";

import he from "npm:html-entities";
import { HTMLElement, NodeType, TextNode, parse } from "npm:node-html-parser";

export type SimplifiedNode = null | string | SimplifiedNode[];

export const findInSimplifiedTree = (
  predicate: (node: SimplifiedNode) => boolean,
) =>
  findInTree(predicate, (x: SimplifiedNode): SimplifiedNode[] =>
    x instanceof Array ? x : [],
  );

const clean = pipe(he.decode, replace(/\s+/g, " "));
const concatStrings = pipe(
  reduce(
    (s: string, x: SimplifiedNode) => clean(s) + " " + clean(x as string),
    () => "",
  ),
  trimWhitesapce,
);

const handlers: [
  (children: SimplifiedNode[]) => boolean,
  (children: SimplifiedNode[]) => SimplifiedNode,
][] = [
  [
    (titleAndContent: SimplifiedNode[]) =>
      titleAndContent?.length === 2 &&
      titleAndContent?.every((x) => typeof x === "string") &&
      (titleAndContent?.[1] as string).startsWith(":"),
    concatStrings,
  ],
  [
    (arr: SimplifiedNode[]) =>
      arr.every((x) => typeof x === "string") && arr.length > 2,
    concatStrings,
  ],
  [pipe(length, equals(1)), head],
  [empty<SimplifiedNode>, always(null)],
  [
    (x: SimplifiedNode) => typeof x === "string",
    (x: SimplifiedNode) => (x as string).trim(),
  ],
  [() => true, identity],
];

const isBadNode = (node: HTMLElement) =>
  ["SCRIPT", "STYLE", "NOSCRIPT"].includes(node.tagName);

const convertToTreeNode = (node: TextNode | HTMLElement): SimplifiedNode =>
  node.nodeType === NodeType.TEXT_NODE
    ? node.innerText.trim() && node.innerText.trim() !== "&nbsp;"
      ? clean(node.innerText.trim())
      : null
    : isBadNode(node as HTMLElement)
    ? null
    : pipe(
        map(convertToTreeNode),
        filter((x: SimplifiedNode) => x),
        cond(handlers),
      )(node.childNodes as (TextNode | HTMLElement)[]);

export const simplifyHtml = pipe((x) => parse(x, {}), convertToTreeNode);
