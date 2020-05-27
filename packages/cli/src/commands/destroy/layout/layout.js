import { files as layoutFiles } from '../../generate/layout/layout'
import { createYargsForComponentDestroy } from '../helpers'

export const {
  command,
  desc,
  builder,
  handler,
  tasks,
} = createYargsForComponentDestroy({
  componentName: 'layout',
  filesFn: layoutFiles,
})
