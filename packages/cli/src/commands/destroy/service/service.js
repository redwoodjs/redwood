import { createYargsForComponentDestroy } from '../../generate/helpers'
import { files } from '../../generate/service/service'

// This function wraps files(), so we can pass templateVars. templateVars
// referenced in a file template must be defined, otherwise template rendering
// fails. This way we can pass stub values for templateVars and do not define
// fake builder flags for destroy command just to make templates work.
//
// Better solution would be to split file paths resolving and template
// rendering into separate functions. See more in this PR discussion:
// https://github.com/redwoodjs/redwood/pull/487#issue-411204396
export const filesWithTemplateVars = (templateVars) => {
  return (args) => files({ ...args, ...templateVars })
}

export const { command, desc, handler } = createYargsForComponentDestroy({
  componentName: 'service',
  filesFn: filesWithTemplateVars({ crud: false }),
})
