declare module 'react-server-dom-webpack/node-loader'
declare module 'react-server-dom-webpack/server'
declare module 'react-server-dom-webpack/server.node.unbundled'

declare module 'react-server-dom-webpack/client' {
  // https://github.com/facebook/react/blob/dfaed5582550f11b27aae967a8e7084202dd2d90/packages/react-server-dom-webpack/src/ReactFlightDOMClientBrowser.js#L31
  export type Options<A, T> = {
    callServer?: (id: string, args: A) => Promise<T>
  }

  export function createFromFetch<A, T>(
    // `Response` is a Web Response:
    // https://developer.mozilla.org/en-US/docs/Web/API/Response
    promiseForResponse: Promise<Response>,
    options?: Options<A, T>,
  ): Thenable<T>

  export function encodeReply(
    // https://github.com/facebook/react/blob/dfaed5582550f11b27aae967a8e7084202dd2d90/packages/react-client/src/ReactFlightReplyClient.js#L65
    value: ReactServerValue,
  ): Promise<string | URLSearchParams | FormData>
}

declare module 'acorn-loose'
declare module 'vite-plugin-cjs-interop'
