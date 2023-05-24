#!/usr/bin/env node
import { createRequire } from 'module'

const requireFromStorybook = createRequire(
  require.resolve('storybook/package.json')
)

const bins = requireFromStorybook('./package.json')['bin']

requireFromStorybook(bins['storybook'])
