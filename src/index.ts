import { complement, empty, filter, map, max } from "gamla";
import {
  cond,
  equals,
  findInTree,
  length,
  pipe,
  reduce,
  reduceTree,
  replace,
  trimWhitespace,
} from "https://deno.land/x/gamla@41.0.0/src/index.ts";

import he from "npm:html-entities";
import { HTMLElement, Node, NodeType, parse } from "npm:node-html-parser";

type AnnotatedText = Record<string, string>;

const clean = pipe(he.decode, replace(/\s+/g, " "));

const concatStrings = pipe(
  reduce(
    (s: string, x: SimplifiedNode) => clean(s) + " " + clean(x as string),
    () => "",
  ),
  trimWhitespace,
);

const isString = (x: SimplifiedNode): x is string => typeof x === "string";

const isElement = (node: Node): node is HTMLElement =>
  node.nodeType === NodeType.ELEMENT_NODE;

const isTextNode = (node: Node) => node.nodeType === NodeType.TEXT_NODE;

const isBadNode = (node: Node) =>
  isElement(node) && ["SCRIPT", "STYLE", "NOSCRIPT"].includes(node.tagName);

const detectTitle = (node: Node) =>
  isElement(node) && /h\d/i.test(node.tagName);

const current = (current: Node, _: SimplifiedNode[]) => current;

const children = (_: Node, children: SimplifiedNode[]) => children;

const unwrap = ([element]: SimplifiedNode[]) => element;

type PredicateAndHandler = [
  (current: Node, children: SimplifiedNode[]) => boolean,
  (current: Node, children: SimplifiedNode[]) => SimplifiedNode,
];

const isUrl = (x: string) =>
  /^\w.*/.test(x) && /(www)|(https?)|(\.com)|\.org/.test(x) && /[^\s]+/.test(x);

const textBasedAnnotation = (t: string): AnnotatedText | string =>
  isUrl(t) ? { url: t } : t;

const childrenHandlers: [
  (children: SimplifiedNode[]) => null | boolean | string,
  (children: SimplifiedNode[]) => SimplifiedNode,
][] = [
  [
    (childs: SimplifiedNode[]) =>
      childs.length === 2 &&
      childs.every(isString) &&
      (childs[0].endsWith(":") || childs[1].startsWith(":")),
    concatStrings,
  ],
  [
    (childs: SimplifiedNode[]) => childs.every(isString) && childs.length > 2,
    pipe(concatStrings, textBasedAnnotation),
  ],
  [pipe(length<SimplifiedNode>, equals(1)), unwrap],
  [empty<SimplifiedNode>, () => null],
  [
    ([x, y, z]: SimplifiedNode[]) =>
      // @ts-expect-error too complex to infer
      [x, y].every(complement(isString)) && x?.title && y?.url && isString(z),
    // @ts-expect-error too complex to infer
    ([x, y, z]: SimplifiedNode[]) => ({ ...x, ...y, paragraph: z }),
  ],
  [
    () => true,
    (x) => {
      // console.log(`unrecognized ${JSON.stringify(x, null, 2)}`);
      return x;
    },
  ],
];

const handlers: PredicateAndHandler[] = [
  [pipe(current, isBadNode), () => null],
  [
    pipe(current, isTextNode),
    pipe(current, ({ innerText }: Node) =>
      innerText.trim() && innerText.trim() !== "&nbsp;"
        ? textBasedAnnotation(clean(innerText.trim()))
        : null,
    ),
  ],
  [
    pipe(current, detectTitle),
    pipe(
      children,
      filter((x: SimplifiedNode) => x),
      (children: SimplifiedNode[]) => ({
        title: children.every(isString)
          ? concatStrings(children)
          : (children[0] as string),
      }),
    ),
  ],
  // @ts-expect-error too complex inference
  ...childrenHandlers.map(
    map((f) =>
      pipe(
        children,
        filter((x: SimplifiedNode) => x),
        f,
      ),
    ),
  ),
];

const getChildren = (node: Node) => (isElement(node) ? node.childNodes : []);

export const simplifyHtml = pipe(
  (x) => parse(x, {}),
  reduceTree(getChildren, cond(handlers)),
);

export type SimplifiedNode = AnnotatedText | null | string | SimplifiedNode[];

export const findInSimplifiedTree = (
  predicate: (node: SimplifiedNode) => boolean,
) =>
  findInTree(predicate, (x: SimplifiedNode): SimplifiedNode[] =>
    Array.isArray(x)
      ? x
      : isString(x)
      ? []
      : x === null
      ? []
      : Object.values(x),
  );

export const mainList = reduceTree(
  (node: SimplifiedNode) => (Array.isArray(node) ? node : []),
  (
    current: SimplifiedNode,
    children: (null | SimplifiedNode[])[],
  ): null | SimplifiedNode[] => {
    const childrenCandidates = children.filter(Array.isArray);
    const candidates: SimplifiedNode[][] = Array.isArray(current)
      ? [current, ...childrenCandidates]
      : childrenCandidates;
    return empty(candidates) ? null : max(length<SimplifiedNode>)(candidates);
  },
);
