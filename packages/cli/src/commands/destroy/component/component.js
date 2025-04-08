import { files as componentFiles } from '../../generate/component/component.js'
import { createYargsForComponentDestroy } from '../helpers.js'

export const description = 'Destroy a component'

export const { command, builder, handler, tasks } =
  createYargsForComponentDestroy({
    componentName: 'component',
    filesFn: componentFiles,
  })
