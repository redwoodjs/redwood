// The types for these functions were taken from react-server-dom-webpack/src/ReactFlightDOMServerNode.js
// whichi s what 'react-server-dom-webpack/server' resolves to with the 'react-server' condition.
// See https://github.com/facebook/react/blob/b09e102ff1e2aaaf5eb6585b04609ac7ff54a5c8/packages/react-server-dom-webpack/src/ReactFlightDOMServerNode.js#L120.
//
// It's difficult to know the true type of `ServerManifest`.
// A lot of the react source files are stubs taht are replaced at build time.
// Going off this reference for now: https://github.com/facebook/react/blob/b09e102ff1e2aaaf5eb6585b04609ac7ff54a5c8/packages/react-server-dom-webpack/src/ReactFlightClientConfigBundlerWebpack.js#L40

export type ImportManifestEntry = {
  id: string,
  // chunks is a double indexed array of chunkId / chunkFilename pairs
  chunks: Array<string>,
  name: string,
};

export type ServerManifest = {
  [id: string]: ImportManifestEntry,
};

import type { Busboy } from 'busboy'

/**
 * WARNING: The types for this were handwritten by looking at React's source and could be wrong.
 */
export function decodeReply<T>(
  body: string | FormData,
  webpackMap?: ServerManifest,
): Promise<T>

/**
 * WARNING: The types for this were handwritten by looking at React's source and could be wrong.
 */
export function decodeReplyFromBusboy<T>(
  busboyStream: Busboy,
  webpackMap?: ServerManifest
): Promsie<T>
