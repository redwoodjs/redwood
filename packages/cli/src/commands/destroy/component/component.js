import { createYargsForComponentDestroy } from '../../generate/helpers'
import { files } from '../../generate/component/component'

export const {
  command,
  desc,
  builder,
  handler,
} = createYargsForComponentDestroy({
  componentName: 'component',
  filesFn: files,
})
