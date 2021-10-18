import { transformTSToJS } from '../../../lib'
import { yargsDefaults } from '../../generate'
import {
  templateForComponentFile,
  createYargsForComponentGeneration,
} from '../helpers'

const COMPONENT_SUFFIX = 'Layout'
const REDWOOD_WEB_PATH_NAME = 'layouts'

export const files = ({ name, typescript = false, ...options }) => {
  const extension = typescript ? '.tsx' : '.js'
  const layoutFile = templateForComponentFile({
    name,
    suffix: COMPONENT_SUFFIX,
    webPathSection: REDWOOD_WEB_PATH_NAME,
    subSection: options.path,
    extension,
    generator: 'layout',
    templatePath: options.skipLink
      ? 'layout.tsx.a11yTemplate'
      : 'layout.tsx.template',
  })
  const testFile = templateForComponentFile({
    name,
    suffix: COMPONENT_SUFFIX,
    extension: `.test${extension}`,
    webPathSection: REDWOOD_WEB_PATH_NAME,
    subSection: options.path,
    generator: 'layout',
    templatePath: 'test.tsx.template',
  })
  const storyFile = templateForComponentFile({
    name,
    suffix: COMPONENT_SUFFIX,
    extension: `.stories${extension}`,
    webPathSection: REDWOOD_WEB_PATH_NAME,
    subSection: options.path,
    generator: 'layout',
    templatePath: 'stories.tsx.template',
  })

  const files = [layoutFile]
  if (options.stories) {
    files.push(storyFile)
  }

  if (options.tests) {
    files.push(testFile)
  }

  // Returns
  // {
  //    "path/to/fileA": "<<<template>>>",
  //    "path/to/fileB": "<<<template>>>",
  // }
  return files.reduce((acc, [outputPath, content]) => {
    const template = typescript ? content : transformTSToJS(outputPath, content)

    return {
      [outputPath]: template,
      ...acc,
    }
  }, {})
}

const optionsObj = {
  skipLink: {
    default: false,
    description: 'Generate with skip link',
    type: 'boolean',
  },
  ...yargsDefaults,
}

export const { command, description, builder, handler } =
  createYargsForComponentGeneration({
    componentName: 'layout',
    filesFn: files,
    optionsObj,
  })
