import { RwRscServerGlobal } from './RwRscServerGlobal'
export { RwRscServerGlobal } from './RwRscServerGlobal'
export { DevRwRscServerGlobal } from './DevRwRscServerGlobal'
export { ProdRwRscServerGlobal } from './ProdRwRscServerGlobal'
export type AssetDesc = string | { type: 'style'; style: string; src?: string }

declare global {
  /* eslint-disable no-var */
  var rwRscGlobal: RwRscServerGlobal
}
