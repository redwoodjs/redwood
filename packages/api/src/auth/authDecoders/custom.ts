export type Custom = any

import { AuthDecoder } from './'

export interface AuthDecoderCustom extends AuthDecoder {
  decoder: Custom
  type: 'custom'
}

export const custom = (authDecoder: AuthDecoderCustom) => authDecoder
