import { createYargsForComponentDestroy } from '../../generate/helpers'
import { files } from '../../generate/layout/layout'

export const {
  command,
  desc,
  builder,
  handler,
} = createYargsForComponentDestroy({
  componentName: 'layout',
  filesFn: files,
})
