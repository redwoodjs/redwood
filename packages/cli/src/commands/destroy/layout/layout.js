import { files as layoutFiles } from '../../generate/layout/layout.js'
import { createYargsForComponentDestroy } from '../helpers.js'

export const { command, description, builder, handler, tasks } =
  createYargsForComponentDestroy({
    componentName: 'layout',
    filesFn: layoutFiles,
  })
