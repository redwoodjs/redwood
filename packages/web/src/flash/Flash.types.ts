import { CSSProperties } from 'react'

export interface FlashMessage extends FlashMessageOptions {
  readonly id: number
  readonly text: string
}

export interface FlashMessageOptions {
  readonly style?: CSSProperties
  readonly classes?: string
  readonly persist?: boolean
  readonly viewed?: boolean
}
