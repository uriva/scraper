import {
  allmap,
  cond,
  empty,
  findInTree,
  findInTreeExhaustive,
  hash,
  head,
  intersectBy,
  max,
  nonempty,
  pipe,
  reduce,
  reduceTree,
  replace,
  trimWhitespace,
  unique,
  uniqueBy,
} from "gamla";

import he from "npm:html-entities";
import {
  type HTMLElement,
  type Node,
  NodeType,
  parse,
} from "npm:node-html-parser";

type Primitive = { type: "primitive"; value: string; substructures: string[] };
type Labeled = { type: "labeled"; label: string; children: SimplifiedNode[] };
type Unlabeled = { type: "unlabeled"; children: SimplifiedNode[] };

export type SimplifiedNode =
  | { type: "empty" }
  | Primitive
  | Labeled
  | Unlabeled;

const clean = pipe(he.decode, replace(/\s+/g, " "), trimWhitespace);

const concatPrimitives = reduce(
  (s: Primitive, { value, substructures }: Primitive): Primitive => ({
    type: "primitive",
    value: trimWhitespace(`${clean(s.value)} ${clean(value)}`),
    substructures: unique([...s.substructures, ...substructures]),
  }),
  () => ({ type: "primitive" as const, value: "", substructures: [] }),
);

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

const children = pipe(
  (_: Node, children: SimplifiedNode[]) =>
    children.filter(
      (x) =>
        x.type !== "empty" &&
        !(x.type === "unlabeled" && x.children.length === 0),
    ),
  uniqueBy((x: SimplifiedNode) =>
    hash(x.type === "primitive" ? { ...x, substructures: [] } : x, 10)
  ),
);

type PredicateAndHandler = [
  (current: Node, children: SimplifiedNode[]) => boolean,
  (current: Node, children: SimplifiedNode[]) => SimplifiedNode,
];

const isSingleton = <T>(x: T[]) => x.length === 1;

const liftText = pipe(
  clean,
  (value: string): SimplifiedNode =>
    value
      ? { type: "primitive", value, substructures: [hash(value, 10)] }
      : { type: "empty" },
);

const isAnchorNode = (node: Node) => isElement(node) && node.tagName === "A";

const isPictureNode = (node: Node) => isElement(node) && node.tagName === "IMG";

const handlers: PredicateAndHandler[] = [
  [pipe(current, isBadNode), () => ({ type: "empty" })],
  [
    pipe(current, isTextNode),
    pipe(current, ({ innerText }: Node) => liftText(innerText)),
  ],
  [
    pipe(current, isPictureNode),
    pipe(current, (elem: HTMLElement) => liftText(elem.getAttribute("alt"))),
  ],
  [
    pipe(current, isAnchorNode),
    pipe(
      current,
      (elem: HTMLElement) =>
        liftText(`[${elem.innerText.trim()}](${elem.getAttribute("href")})`),
    ),
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
      if (c.every(isPrimitive)) return concatPrimitives(c as Primitive[]);
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
    pipe(
      children,
      (x: SimplifiedNode[]) =>
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
      (c: Primitive[]) => {
        const commonSubstructures = intersectBy((x: string) => x)(
          c.map((c) => c.substructures),
        );
        if (nonempty(commonSubstructures)) {
          return {
            type: "unlabeled",
            children: c.map((c) => ({
              ...c,
              substructures: [],
            })),
          } satisfies Unlabeled;
        }
        return concatPrimitives(c as Primitive[]);
      },
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

export const findInSimplifiedTreeExhaustive = (
  predicate: (node: SimplifiedNode) => boolean,
) => findInTreeExhaustive(predicate, simplifiedNodeChildren);

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
    if (current.type === "labeled") {
      return `${current.label}\n${children.reduce((a, b) => `${a}\n${b}`, "")}`;
    }
    if (current.type === "primitive") return current.value;
    if (current.type === "unlabeled") {
      return children.reduce((a, b) => `${a}\n${b}`, "");
    }
    if (current.type === "empty") return "";
    throw new Error("unhandled type");
  },
);
