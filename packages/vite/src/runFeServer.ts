import React from 'react'

import { createServerAdapter } from '@whatwg-node/server'
import express from 'express'
// @ts-expect-error - Should be available on 'react-dom/server', but is not.
// See https://github.com/facebook/react/issues/26906
import { renderToReadableStream } from 'react-dom/server.edge'
import { createFromReadableStream } from 'react-server-dom-webpack/client.edge'

import { moduleMap } from './streaming/ssrModuleMap.js'

export async function runFeServer() {
  const app = express()

  registerFwShims()

  app.get('/', createServerAdapter(reactRenderToStreamResponse))

  app.listen(8910)
  console.log('Started production FE server on http://localhost:8910')
}

runFeServer()

function registerFwShims() {
  globalThis.__rw_module_cache__ ||= new Map()

  globalThis.__webpack_chunk_load__ ||= async (id: string) => {
    console.log('rscWebpackShims chunk load id', id)
    return import(id).then((m) => globalThis.__rw_module_cache__.set(id, m))
  }

  globalThis.__webpack_require__ ||= (id: string) => {
    return globalThis.__rw_module_cache__.get(id)
  }
}

export async function reactRenderToStreamResponse() {
  const rootFromDist = await renderFromDist()

  const stream = await renderToReadableStream(
    React.createElement(rootFromDist),
    {
      onError: (err: any) => {
        console.error(err)
        throw new Error('🔻🔻 Caught error rendering to stream 🔻🔻')
      },
    },
  )

  return new Response(stream, {
    headers: { 'content-type': 'text/html' },
  })
}

async function renderFromDist() {
  const SsrComponent = () => {
    const flightStreamFull = new Response(flightText).body

    const data = createFromReadableStream(flightStreamFull, {
      ssrManifest: { moduleMap, moduleLoading: null },
    })

    return data
  }

  return SsrComponent
}

const flightText = `\
2:I["/Users/tobbe/tmp/test-project-rsc-external-packages-and-cells/web/dist/client/assets/rsc-AboutCounter.tsx-2-ChTgbQz5.mjs",["/Users/tobbe/tmp/test-project-rsc-external-packages-and-cells/web/dist/client/assets/rsc-AboutCounter.tsx-2-ChTgbQz5.mjs"],"AboutCounter"]
0:["$","div",null,{"className":"about-page","children":["$","div",null,{"style":{"border":"3px red dashed","margin":"1em","padding":"1em"},"children":[["$","h1",null,{"children":"About Page"}],["$","$L2",null,{}]]}]}]
1:]`
