import React from 'react'

// @ts-expect-error - Should be available on 'react-dom/server', but is not.
// See https://github.com/facebook/react/issues/26906
// TODO (RSC): See if we can type this as RenderToReadableStream in modules.d.ts
import { renderToReadableStream } from 'react-dom/server.edge'

import type { MiddlewareResponse } from '../middleware/MiddlewareResponse.js'

// import { moduleMap } from './ssrModuleMap.js'

const HtmlBody = ({ children }: { children: React.ReactNode }) => {
  return React.createElement('html', {}, [
    React.createElement('body', {}, [children]),
  ])
}

const AboutPage = () => {
  const [count, setCount] = React.useState(0)
  return React.createElement(
    'div',
    {
      style: {
        border: '3px red dashed',
        margin: '1em',
        padding: '1em',
      },
    },
    [
      React.createElement('h1', {}, 'About Page'),
      React.createElement('div', {}, [
        React.createElement(
          'button',
          { onClick: () => setCount(count + 1) },
          'Count ' + count,
        ),
      ]),
    ],
  )
}

export async function reactRenderToStreamResponse(
  mwRes: MiddlewareResponse,
  _renderOptions: any,
  _streamOptions: any,
) {
  // const root = await renderFromDist('AboutPage')
  const root = () =>
    React.createElement(HtmlBody, undefined, React.createElement(AboutPage))

  console.log('root', root)
  //// @ts-expect-error - use() has not been typed yet
  // console.log('created root', createElement(root))

  // const { renderToReadableStream } = await import(
  //   // @ts-expect-error no types
  //   // '/Users/tobbe/tmp/test-project-rsc-external-packages-and-cells/web/dist/server/rd-server.mjs'
  //   '/Users/tobbe/dev/waku/examples/01_template/dist/ssr/rd-server.js'
  // )

  mwRes.body = await renderToReadableStream(React.createElement(root), {
    onError: (err: any) => {
      console.error(err)
      throw new Error('🔻 Caught error outside shell')
    },
  })

  return mwRes.toResponse()
}

// async function renderFromDist(rscId: string) {
//   console.log('streamHelpers - renderFromDist rscId', rscId)

//   // const { createFromReadableStream } = await import(
//   //   'react-server-dom-webpack/client.edge'
//   // )
//   const {
//     default: { createFromReadableStream },
//   } = await import(
//     // @ts-expect-error no types
//     '/Users/tobbe/dev/waku/examples/01_template/dist/ssr/rsdw-client.js'
//   )

//   const SsrComponent = () => {
//     return createFromReadableStream(new Response(flightText).body, {
//       ssrManifest: { moduleMap, moduleLoading: null },
//     })
//   }

//   return SsrComponent
// }

// The `I` format used to be an object with `id`, `chunks`, `name` and `async`
// keys. Now it's just an array with those things specified in that order
// const flightText = `\
// 2:I["/Users/tobbe/tmp/test-project-rsc-external-packages-and-cells/web/dist/client/assets/rsc-AboutCounter.tsx-2-ChTgbQz5.mjs",["/Users/tobbe/tmp/test-project-rsc-external-packages-and-cells/web/dist/client/assets/rsc-AboutCounter.tsx-2-ChTgbQz5.mjs"],"AboutCounter"]
// 0:["$","div",null,{"className":"about-page","children":["$","div",null,{"style":{"border":"3px red dashed","margin":"1em","padding":"1em"},"children":[["$","h1",null,{"children":"About Page"}],["$","$L2",null,{}]]}]}]
// 1:]`
