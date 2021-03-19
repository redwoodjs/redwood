import { transformTSToJS } from 'src/lib'

import { yargsDefaults } from '../../generate'
import {
  templateForComponentFile,
  createYargsForComponentGeneration,
} from '../helpers'

const COMPONENT_SUFFIX = 'Layout'
const REDWOOD_WEB_PATH_NAME = 'layouts'

export const files = ({ name, tests = true, stories = true, ...options }) => {
  // TODO: Replace with check from https://github.com/redwoodjs/redwood/pull/633
  const isJavascript = options.javascript && !options.typescript
  const layoutFile = templateForComponentFile({
    name,
    suffix: COMPONENT_SUFFIX,
    webPathSection: REDWOOD_WEB_PATH_NAME,
    extension: isJavascript ? '.js' : '.tsx',
    generator: 'layout',
    templatePath: options.skipLink
      ? 'layout.tsx.a11yTemplate'
      : 'layout.tsx.template',
  })
  const testFile = templateForComponentFile({
    name,
    suffix: COMPONENT_SUFFIX,
    extension: `.test.${isJavascript ? 'js' : 'tsx'}`,
    webPathSection: REDWOOD_WEB_PATH_NAME,
    generator: 'layout',
    templatePath: 'test.tsx.template',
  })
  const storyFile = templateForComponentFile({
    name,
    suffix: COMPONENT_SUFFIX,
    extension: `.stories.${isJavascript ? 'js' : 'tsx'}`,
    webPathSection: REDWOOD_WEB_PATH_NAME,
    generator: 'layout',
    templatePath: 'stories.tsx.template',
  })

  const files = [layoutFile]
  if (stories) {
    files.push(storyFile)
  }

  if (tests) {
    files.push(testFile)
  }

  // Returns
  // {
  //    "path/to/fileA": "<<<template>>>",
  //    "path/to/fileB": "<<<template>>>",
  // }
  return files.reduce((acc, [outputPath, content]) => {
    const template = isJavascript
      ? transformTSToJS(outputPath, content)
      : content

    return {
      [outputPath]: template,
      ...acc,
    }
  }, {})
}

const builderObj = {
  skipLink: {
    default: false,
    description: 'Generate with skip link',
    type: 'boolean',
  },
  ...yargsDefaults,
}

export const {
  command,
  description,
  builder,
  handler,
} = createYargsForComponentGeneration({
  componentName: 'layout',
  filesFn: files,
  builderObj,
})
