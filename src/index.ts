import {
  alljuxt,
  allmap,
  empty,
  head,
  intersectBy,
  map,
  max,
  nonempty,
  second,
  trimWhitesapce,
} from "gamla";
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

export type SimplifiedNode =
  | null
  | string
  | number
  | boolean
  | { [x: string]: SimplifiedNode }
  | Array<SimplifiedNode>;

const clean = pipe(he.decode, replace(/\s+/g, " "), trimWhitesapce);

const concatStrings = pipe(
  reduce(
    (s: string, x: SimplifiedNode) => clean(s) + " " + clean(x as string),
    () => "",
  ),
  trimWhitespace,
);

const isArray = Array.isArray;

const isObject = (x: SimplifiedNode) => !isArray(x) && typeof x === "object";

const isString = (x: SimplifiedNode): x is string => typeof x === "string";

const isElement = (node: Node): node is HTMLElement =>
  node.nodeType === NodeType.ELEMENT_NODE;

const isTextNode = (node: Node) => node.nodeType === NodeType.TEXT_NODE;

const isBadNode = (node: Node) =>
  isElement(node) && ["SCRIPT", "STYLE", "NOSCRIPT"].includes(node.tagName);

const detectTitle = (node: Node) =>
  isElement(node) && /h\d/i.test(node.tagName);

const detectListItem = (node: Node) =>
  isElement(node) && /(?:[uo])l/i.test(node.tagName);

const current = (current: Node, _: SimplifiedNode[]) => current;

const children = (_: Node, children: SimplifiedNode[]) =>
  children.filter((x) => x && (!isArray(x) || nonempty(x)));

type PredicateAndHandler = [
  (current: Node, children: SimplifiedNode[]) => boolean,
  (current: Node, children: SimplifiedNode[]) => SimplifiedNode,
];

const isSingleton = <T>(x: T[]) => x.length === 1;

const handlers: PredicateAndHandler[] = [
  [pipe(current, isBadNode), () => null],
  [
    pipe(current, isTextNode),
    pipe(current, ({ innerText }: Node) => clean(innerText)),
  ],
  [
    pipe(current, detectListItem),
    pipe(children, (children: SimplifiedNode[]) =>
      isSingleton(children) ? [children[0]] : children,
    ),
  ],
  [
    pipe(current, detectTitle),
    pipe(children, (c: SimplifiedNode[]) => {
      if (c.every(isString)) return { [concatStrings(c)]: null };
      throw new Error(`Cannot handle title ${JSON.stringify(c)}`);
    }),
  ],
  [pipe(children, isSingleton), pipe(children, head<SimplifiedNode[]>)],
  [
    alljuxt(
      pipe(children, length<SimplifiedNode>, equals(2)),
      pipe(children, head<SimplifiedNode[]>, isString),
      pipe(children, second<SimplifiedNode[]>, isArray),
    ),
    pipe(children, ([x, y]: SimplifiedNode[]) =>
      y ? { [x as string]: y } : x,
    ),
  ],
  [pipe(children, empty), () => null],
  [
    pipe(children, allmap(isObject)),
    pipe(children, (x: SimplifiedNode[]) =>
      (x as SomeObj[]).reduce(combineObjects),
    ),
  ],
  [pipe(children, allmap(isString)), pipe(children, concatStrings)],
  [
    () => true,
    pipe(children, (y: SimplifiedNode[]) => {
      // console.log(y);
      return y;
      // throw new Error("unhandled");
    }),
  ],
];

type SomeObj = Record<string, string | string[]>;

const overlappingKeys = pipe(
  map(Object.keys),
  intersectBy((x: string) => x),
);

const combineObjects = (x: SomeObj, y: SomeObj) => {
  // const overlap: SomeObj = {};
  // for (const k of overlappingKeys([x, y])) {
  //   const valX = x[k];
  //   const valY = y[k];
  //   if (Array.isArray(valX) || Array.isArray(valY)) return [x, y];
  //   overlap[k] = [valX, valY];
  // }

  if (nonempty(overlappingKeys([x, y]))) throw new Error();
  return { ...x, ...y };
};

const getChildren = (node: Node) => (isElement(node) ? node.childNodes : []);

export const simplifyHtml: (x: string) => SimplifiedNode = pipe(
  (x) => parse(x, {}),
  reduceTree(getChildren, cond(handlers)),
);

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
