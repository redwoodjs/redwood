import {
  templateForComponentFile,
  createYargsForComponentGeneration,
} from '../helpers'

const COMPONENT_SUFFIX = 'Cell'
const REDWOOD_WEB_PATH_NAME = 'components'
const TEMPLATE_PATH = 'cell/cell.js.template'

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
  componentName: 'cell',
  filesFn: files,
})
