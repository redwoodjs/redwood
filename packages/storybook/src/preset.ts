import { dirname, join } from 'path'

import type { PresetProperty } from '@storybook/types'
import { mergeConfig } from 'vite'

import { getPaths } from '@redwoodjs/project-config'

import { autoImports } from './plugins/auto-imports'
import { mockAuth } from './plugins/mock-auth'
import { mockRouter } from './plugins/mock-router'
import { reactDocgen } from './plugins/react-docgen'
import type { StorybookConfig } from './types'

const getAbsolutePath = <I extends string>(input: I): I =>
  dirname(require.resolve(join(input, 'package.json'))) as any

export const core: PresetProperty<'core'> = {
  builder: getAbsolutePath('@storybook/builder-vite'),
  renderer: getAbsolutePath('@storybook/react'),
}

export const previewAnnotations: StorybookConfig['previewAnnotations'] = (
  entry,
) => {
  return [...entry, require.resolve('./preview.js')]
}

const redwoodProjectPaths = getPaths()

export const viteFinal: StorybookConfig['viteFinal'] = async (config) => {
  const { plugins = [] } = config

  // Needs to run before the react plugin, so add to the front
  plugins.unshift(
    reactDocgen({
      include: /\.(mjs|tsx?|jsx?)$/,
    }),
  )

  return mergeConfig(config, {
    // This is necessary as it otherwise just points to the `web` directory,
    // but it needs to point to `web/src`
    root: redwoodProjectPaths.web.src,
    plugins: [mockRouter(), mockAuth(), autoImports],
    resolve: {
      alias: {
        '~__REDWOOD__USER_ROUTES_FOR_MOCK': redwoodProjectPaths.web.routes,
        '~__REDWOOD__USER_WEB_SRC': redwoodProjectPaths.web.src,
      },
    },
  })
}
