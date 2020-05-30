import { files as cellFiles } from '../../generate/cell/cell'
import { createYargsForComponentDestroy } from '../helpers'

export const {
  command,
  desc,
  builder,
  handler,
  tasks,
} = createYargsForComponentDestroy({
  componentName: 'cell',
  filesFn: cellFiles,
})
