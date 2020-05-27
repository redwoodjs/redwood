import { files as functionFiles } from '../../generate/function/function'
import { createYargsForComponentDestroy } from '../helpers'

export const desc = 'Destroy a function'

export const {
  builder,
  command,
  handler,
  tasks,
} = createYargsForComponentDestroy({
  componentName: 'function',
  filesFn: functionFiles,
})
