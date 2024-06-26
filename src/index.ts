import {
  allmap,
  cond,
  empty,
  findInTree,
  head,
  max,
  pipe,
  reduce,
  reduceTree,
  replace,
  trimWhitespace,
} from "https://deno.land/x/gamla@42.0.0/src/index.ts";

import he from "npm:html-entities";
import { HTMLElement, Node, NodeType, parse } from "npm:node-html-parser";

type Primitive = { type: "primitive"; value: string };
type Labeled = { type: "labeled"; label: string; children: SimplifiedNode[] };
type Unlabeled = { type: "unlabeled"; children: SimplifiedNode[] };

export type SimplifiedNode =
  | { type: "empty" }
  | Primitive
  | Labeled
  | Unlabeled;

const clean = pipe(he.decode, replace(/\s+/g, " "), trimWhitespace);

const concatPrimitives = pipe(
  reduce(
    (s: string, { value }: Primitive) => clean(s) + " " + clean(value),
    () => "",
  ),
  trimWhitespace,
);

const isArray = Array.isArray;

const isLabeled = (x: SimplifiedNode): x is Labeled => x.type === "labeled";

const isUnlabeled = (x: SimplifiedNode): x is Unlabeled =>
  x.type === "unlabeled";

const isPrimitive = ({ type }: SimplifiedNode) => type === "primitive";

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
  children.filter(
    (x) =>
      x.type !== "empty" &&
      !(x.type === "unlabeled" && x.children.length === 0),
  );

type PredicateAndHandler = [
  (current: Node, children: SimplifiedNode[]) => boolean,
  (current: Node, children: SimplifiedNode[]) => SimplifiedNode,
];

const isSingleton = <T>(x: T[]) => x.length === 1;

const liftText = pipe(
  clean,
  (value: string): SimplifiedNode =>
    value ? { type: "primitive", value } : { type: "empty" },
);

const handlers: PredicateAndHandler[] = [
  [pipe(current, isBadNode), () => ({ type: "empty" })],
  [
    pipe(current, isTextNode),
    pipe(current, ({ innerText }: Node) => liftText(innerText)),
  ],
  [
    pipe(current, detectListItem),
    pipe(
      children,
      (children: SimplifiedNode[]): SimplifiedNode =>
        isSingleton(children) ? children[0] : { type: "unlabeled", children },
    ),
  ],
  [
    pipe(current, detectTitle),
    pipe(children, (c: SimplifiedNode[]) => {
      if (c.every(isPrimitive))
        return liftText(concatPrimitives(c as Primitive[]));
      throw new Error(`Cannot handle title ${JSON.stringify(c)}`);
    }),
  ],
  [pipe(children, isSingleton), pipe(children, head<SimplifiedNode[]>)],
  [
    pipe(
      children,
      (children: SimplifiedNode[]) =>
        children.length === 2 &&
        isPrimitive(children[0]) &&
        isUnlabeled(children[1]),
    ),
    pipe(
      children,
      ([x, y]: [Primitive, Unlabeled]): Labeled => ({
        type: "labeled",
        label: x.value,
        children: [y],
      }),
    ),
  ],
  [pipe(children, empty), () => ({ type: "empty" })],
  [
    pipe(children, allmap(isLabeled)),
    pipe(children, (x: SimplifiedNode[]) =>
      (x as Labeled[]).reduce(combineLabeled, {
        type: "unlabeled",
        children: [],
      } as Unlabeled),
    ),
  ],
  [
    pipe(children, allmap(isPrimitive)),
    pipe(
      children,
      (c: SimplifiedNode[]): SimplifiedNode =>
        liftText(concatPrimitives(c as Primitive[])),
    ),
  ],
  [
    pipe(
      children,
      ([title]: SimplifiedNode[]) =>
        title && isLabeled(title) && title.children.length === 0,
    ),
    pipe(
      children,
      ([title, ...children]: SimplifiedNode[]): SimplifiedNode => ({
        type: "labeled",
        label: (title as Labeled).label,
        children,
      }),
    ),
  ],
  [
    () => true,
    pipe(children, (children: SimplifiedNode[]): SimplifiedNode => {
      // console.log(y);
      return { type: "unlabeled", children };
      // throw new Error("unhandled");
    }),
  ],
];

const combineLabeled = (x: Unlabeled, y: Labeled) => ({
  ...x,
  children: [...x.children, y],
});

const getChildren = (node: Node) => (isElement(node) ? node.childNodes : []);

export const simplifyHtml: (x: string) => SimplifiedNode = pipe(
  (x) => parse(x, {}),
  reduceTree(getChildren, cond(handlers)),
);

const simplifiedNodeChildren = (x: SimplifiedNode): SimplifiedNode[] =>
  "children" in x ? x.children : [];

export const findInSimplifiedTree = (
  predicate: (node: SimplifiedNode) => boolean,
) => findInTree(predicate, simplifiedNodeChildren);

export const mainList = reduceTree(
  simplifiedNodeChildren,
  (current: SimplifiedNode, children: Unlabeled[]): Unlabeled => {
    const candidates: Unlabeled[] = isUnlabeled(current)
      ? [current, ...children]
      : children;
    return empty(candidates)
      ? { type: "unlabeled", children: [] }
      : max((x: Unlabeled) => x.children.length)(candidates);
  },
);

export const filterPageParts = (predicate: (x: SimplifiedNode) => boolean) =>
  reduceTree(
    simplifiedNodeChildren,
    (current: SimplifiedNode, children: SimplifiedNode[]): SimplifiedNode => {
      if (!predicate(current)) return { type: "empty" };
      if (!("children" in current)) return current;
      return {
        ...current,
        children: children.filter((x) => x.type !== "empty"),
      };
    },
  );

export const simplifiedHtmlToString = reduceTree(
  simplifiedNodeChildren,
  (current: SimplifiedNode, children: string[]): string => {
    if (current.type === "labeled")
      return current.label + "\n" + children.reduce((a, b) => a + "\n" + b, "");
    if (current.type === "primitive") return current.value;
    if (current.type === "unlabeled")
      return children.reduce((a, b) => a + "\n" + b, "");
    if (current.type === "empty") return "";
    throw new Error("unhandled type");
  },
);
