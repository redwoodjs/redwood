import { MockProviders } from '@redwoodjs/testing'

export const providersDecorator = (storyFn: () => {}) => (
  <MockProviders>{storyFn()}</MockProviders>
)
