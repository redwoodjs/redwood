// @ts-expect-error - TODO (RSC): See if we can type this as RenderToReadableStream in modules.d.ts
import { renderToReadableStream } from 'react-dom/server.edge'

import type { MiddlewareResponse } from '../middleware/MiddlewareResponse.js'

export async function reactRenderToStreamResponse(
  mwRes: MiddlewareResponse,
  _renderOptions: any,
  _streamOptions: any,
) {
  const root = await renderFromDist('AboutPage')

  mwRes.body = await renderToReadableStream(root(), {
    onError: (err: any) => {
      console.error(err)
      throw new Error('🔻 Caught error outside shell')
    },
  })

  return mwRes.toResponse()
}

async function renderFromDist(rscId: string) {
  console.log('streamHelpers - renderFromDist rscId', rscId)

  const { createFromReadableStream } = await import(
    'react-server-dom-webpack/client.edge'
  )

  const SsrComponent = () => {
    return createFromReadableStream(new Response(flightText).body)
  }

  return SsrComponent
}

const flightText = `\
2:I{"id":"/Users/tobbe/tmp/test-project-rsc-external-packages-and-cells/web/dist/client/assets/rsc-AboutCounter.tsx-7-CaisyRuA.mjs","chunks":["/Users/tobbe/tmp/test-project-rsc-external-packages-and-cells/web/dist/client/assets/rsc-AboutCounter.tsx-7-CaisyRuA.mjs"],"name":"AboutCounter","async":false}
0:["$","div",null,{"className":"about-page","children":["$","div",null,{"style":{"border":"3px red dashed","margin":"1em","padding":"1em"},"children":[["$","h1",null,{"children":"About Page"}],["$","$L2",null,{}]]}]}]
1:]`
