import { files as componentFiles } from '../../generate/component/component'
import { createYargsForComponentDestroy } from '../helpers'

export const desc = 'Destroy a component.'

export const { command, builder, handler } = createYargsForComponentDestroy({
  componentName: 'component',
  filesFn: componentFiles,
})
