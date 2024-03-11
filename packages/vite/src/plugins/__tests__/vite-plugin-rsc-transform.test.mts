import * as path from 'node:path'

import { vol } from 'memfs'

import { rscTransformPlugin } from '../vite-plugin-rsc-transform.js'
import { afterAll, beforeAll, describe, it, expect, vi } from 'vitest'

const clientEntryFiles = {
  'rsc-AboutCounter.tsx-0':
    '/Users/tobbe/rw-app/web/src/components/Counter/AboutCounter.tsx',
  'rsc-Counter.tsx-1':
    '/Users/tobbe/rw-app/web/src/components/Counter/Counter.tsx',
  'rsc-NewUserExample.tsx-2':
    '/Users/tobbe/rw-app/web/src/components/UserExample/NewUserExample/NewUserExample.tsx',
}

vi.mock('fs', async () => ({ default: (await import('memfs')).fs }))

const RWJS_CWD = process.env.RWJS_CWD

beforeAll(() => {
  process.env.RWJS_CWD = '/Users/tobbe/rw-app/'
  vol.fromJSON({ 'redwood.toml': '' }, process.env.RWJS_CWD)
})

afterAll(() => {
  process.env.RWJS_CWD = RWJS_CWD
})

describe('rscTransformPlugin', () => {
  it('should insert Symbol.for("react.client.reference")', async () => {
    const plugin = rscTransformPlugin(clientEntryFiles)

    if (typeof plugin.transform !== 'function') {
      return
    }

    // Calling `bind` to please TS
    // See https://stackoverflow.com/a/70463512/88106
    const output = await plugin.transform.bind({})(
      `"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import React from "react";
import "client-only";
import styles from "./Counter.module.css";
import "./Counter.css";
export const Counter = () => {
  const [count, setCount] = React.useState(0);
  return /* @__PURE__ */ jsxs("div", { style: {
    border: "3px blue dashed",
    margin: "1em",
    padding: "1em"
  }, children: [
    /* @__PURE__ */ jsxs("p", { children: [
      "Count: ",
      count
    ] }),
    /* @__PURE__ */ jsx("button", { onClick: () => setCount((c) => c + 1), children: "Increment" }),
    /* @__PURE__ */ jsx("h3", { className: styles.header, children: "This is a client component." })
  ] });
};`,
      '/Users/tobbe/rw-app/web/src/components/Counter/Counter.tsx'
    )

    expect(output).toEqual(
      `const CLIENT_REFERENCE = Symbol.for('react.client.reference');
export const Counter = Object.defineProperties(function() {throw new Error("Attempted to call Counter() from the server but Counter is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");},{$$typeof: {value: CLIENT_REFERENCE},$$id: {value: "${(
        path.sep +
        path.join(
          'Users',
          'tobbe',
          'rw-app',
          'web',
          'dist',
          'rsc',
          'assets',
          'rsc-Counter.tsx-1.mjs'
        )
      ).replaceAll('\\', '\\\\')}#Counter"}});
`
    )
  })
})
