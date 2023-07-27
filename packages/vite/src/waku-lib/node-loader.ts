// This loader is needed to make react-server-dom-webpack/node-loader work.
// Without it we get the following error:
//
// resolve ./dist/node/index.js {
//   conditions: [ 'node', 'import', 'node-addons', 'react-server' ],
//   importAssertions: [Object: null prototype] {},
//   parentURL: 'file:///Users/tobbe/tmp/rw-rsc-esm/node_modules/vite/index.cjs'
// }
// (node:33561) DeprecationWarning: Obsolete loader hook(s) supplied and will be ignored: getSource, transformSource
// /Users/tobbe/tmp/rw-rsc-esm/node_modules/@redwoodjs/vite/dist/react-server-dom-webpack/node-loader.js:357
//       throw new Error('Expected source to have been loaded into a string.');
//             ^

// Error: Expected source to have been loaded into a string.
//     at load (/Users/tobbe/tmp/rw-rsc-esm/node_modules/@redwoodjs/vite/dist/react-server-dom-webpack/node-loader.js:357:13)
//     at async nextLoad (node:internal/modules/esm/loader:163:22)

export async function load(url: string, context: any, nextLoad: any) {
  // console.log('waku-lib/node-loader: load', context.format, url)

  const result = await nextLoad(url, context, nextLoad)

  if (result.format === 'module') {
    let { source } = result

    if (typeof source !== 'string') {
      source = source.toString()
    }

    return { ...result, source }
  }

  return result
}
