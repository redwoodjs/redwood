import { createYargsForComponentDestroy } from '../../generate/helpers'
import { files } from '../../generate/component/component'

export const desc = 'Destroy a component.'

export const { command, builder, handler } = createYargsForComponentDestroy({
  componentName: 'component',
  filesFn: files,
})
