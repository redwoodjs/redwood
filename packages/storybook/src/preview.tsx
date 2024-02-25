import type { Addon_DecoratorFunction, Addon_Loader } from '@storybook/types'

import { MockingLoader, StorybookProvider } from './__mocks__/StorybookProvider'

export const decorators: Addon_DecoratorFunction<any>[] = [
  (storyFn, { id }) => React.createElement(StorybookProvider, { storyFn, id }),
]

export const loaders: Addon_Loader<any>[] = [MockingLoader]
