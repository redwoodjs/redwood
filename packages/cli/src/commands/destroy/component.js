import { createYargsForComponentDestroy } from 'src/lib'

import { files as componentFiles } from '../generate/component/component'

export const {
  command,
  desc,
  builder,
  handler,
} = createYargsForComponentDestroy({
  componentName: 'component',
  filesFn: componentFiles,
})
