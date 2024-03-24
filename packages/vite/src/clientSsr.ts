import { createFromReadableStream } from 'react-server-dom-webpack/client.edge'

import { moduleMap } from './streaming/ssrModuleMap.js'

export function renderFromDist(_rscId: string) {
  const SsrComponent = () => {
    const flightStream = new Response(flightText).body

    const data = createFromReadableStream(flightStream, {
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
