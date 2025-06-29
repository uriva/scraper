# simplify-html

## Overview

This library simplifies very complicated html pages to simple json object,
detecting the semantic structure of the page, removing most of the boilerplate,
as a human does.

This is especially useful for LLMs that want to read a webpage.

## Installation

nodejs: `npm install npm:@jsr/uri__simplify-html`

deno: `jsr:@uri/simplify-html`

## Example Usage

Web pages often contain a lot of boilerplate, ads, navigation, and other
elements that are not part of the main content. This library extracts the core
semantic structure, making the result much simpler and easier to process or
read.

```ts
import { simplifyHtml } from "jsr:@uri/simplify-html";

// Example HTML string

const html = `
  <html>
    <head>
      <title>Test Page</title>
      <script>console.log('ads or analytics');</script>
      <style>body { color: red; }</style>
    </head>
    <body>
      <nav>Navigation bar</nav>
      <h1>Hello World</h1>
      <p>This is a test.</p>
      <footer>Footer info</footer>
    </body>
  </html>
`;

// Simplify the HTML
const result = simplifyHtml(html);

console.log(result);
// Output: a JSON object representing the semantic structure of the page

// To convert the result to a string (recommended):
import { simplifiedHtmlToString } from "jsr:@uri/simplify-html";
console.log(simplifiedHtmlToString(result));
// Output (example):
// Test Page
// Hello World
// This is a test.
```
