import {
  templateForComponentFile,
  createYargsForComponentGeneration,
} from '../helpers'

const COMPONENT_SUFFIX = 'Layout'
const REDWOOD_WEB_PATH_NAME = 'layouts'
const TEMPLATE_PATH = 'layout/layout.js.template'

export const files = ({ name }) => {
  const [outputPath, template] = templateForComponentFile({
    name,
    suffix: COMPONENT_SUFFIX,
    webPathSection: REDWOOD_WEB_PATH_NAME,
    templatePath: TEMPLATE_PATH,
  })
  return { [outputPath]: template }
}

export const {
  command,
  desc,
  builder,
  handler,
} = createYargsForComponentGeneration({
  componentName: 'layout',
  filesFn: files,
})
