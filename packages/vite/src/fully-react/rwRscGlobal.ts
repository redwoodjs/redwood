import type { RwRscServerGlobal } from './RwRscServerGlobal.js'
export { RwRscServerGlobal } from './RwRscServerGlobal.js'
export { DevRwRscServerGlobal } from './DevRwRscServerGlobal.js'
export { ProdRwRscServerGlobal } from './ProdRwRscServerGlobal.js'
export type AssetDesc = string | { type: 'style'; style: string; src?: string }

declare global {
  /* eslint-disable no-var */
  var rwRscGlobal: RwRscServerGlobal
}
