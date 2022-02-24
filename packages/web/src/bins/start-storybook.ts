import { createRequire } from 'module'

const requireFromStorybook = createRequire(
  require.resolve('@storybook/react/package.json')
)

const bins = requireFromStorybook('./package.json')['bin']

requireFromStorybook(bins['start-storybook'])
