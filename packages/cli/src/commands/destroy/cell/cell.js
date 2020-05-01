import { createYargsForComponentDestroy } from '../../generate/helpers'
import { files } from '../../generate/cell/cell'

export const {
  command,
  desc,
  builder,
  handler,
} = createYargsForComponentDestroy({
  componentName: 'cell',
  filesFn: files,
})
