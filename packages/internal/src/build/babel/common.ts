import type { TransformOptions } from '@babel/core'

export interface RequireHookOptions extends TransformOptions {
  extensions?: string[]
  cache?: boolean
}

// @NOTE
// We do this so we still get type support, but don't import babel/register
// Importing babel/register in typescript (instead of requiring) has dire consequences...

export const registerBabel = (options: RequireHookOptions) => {
  require('@babel/register')(options)
}
