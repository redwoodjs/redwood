import { files as directiveFiles } from '../../generate/directive/directive.js'
import { createYargsForComponentDestroy } from '../helpers.js'

export const description = 'Destroy a directive'

export const { command, handler, builder, tasks } =
  createYargsForComponentDestroy({
    componentName: 'directive',
    filesFn: (args) => directiveFiles({ ...args, type: 'validator' }),
  })
