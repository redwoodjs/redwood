import type { Manifest } from 'vite'
export type { Manifest as BuildManifest }

// import type { RouteManifest } from '../fs-router/types'
// export type { RouteManifest }

import { RwRscServerGlobal } from './RwRscServerGlobal'
export { RwRscServerGlobal } from './RwRscServerGlobal'
export { DevRwRscServerGlobal } from './DevRwRscServerGlobal'
export { ProdRwRscServerGlobal } from './ProdRwRscServerGlobal'
export type AssetDesc = string | { type: 'style'; style: string; src?: string }

declare global {
  /* eslint-disable no-var */
  var rwRscGlobal: RwRscServerGlobal
}

// export const rwRscGlobal: RwRscServerGlobal = new Proxy(
//   globalThis.rwRscGlobal,
//   {
//     get: (_target, prop: keyof RwRscServerGlobal) =>
//       globalThis.rwRscGlobal[prop],
//   }
// )

// export default rwRscGlobal
