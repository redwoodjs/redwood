/* eslint-disable no-redeclare,  no-undef */
import type { GlobalContext } from './context'

declare global {
  const context: GlobalContext
}
