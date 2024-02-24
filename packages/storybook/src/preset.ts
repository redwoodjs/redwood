import { dirname, join } from 'path'

import type { PresetProperty } from '@storybook/types'

import { reactDocgen } from './plugins/react-docgen'
import type { StorybookConfig } from './types'

const getAbsolutePath = <I extends string>(input: I): I =>
  dirname(require.resolve(join(input, 'package.json'))) as any

export const core: PresetProperty<'core'> = {
  builder: getAbsolutePath('@storybook/builder-vite'),
  renderer: getAbsolutePath('@storybook/react'),
}

export const viteFinal: StorybookConfig['viteFinal'] = async (config) => {
  const { plugins = [] } = config

  // Needs to run before the react plugin, so add to the front
  plugins.unshift(
    reactDocgen({
      include: /\.(mjs|tsx?|jsx?)$/,
    })
  )

  return config
}
