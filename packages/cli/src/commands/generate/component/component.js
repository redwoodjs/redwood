import { transformTSToJS } from 'src/lib'

import {
  templateForComponentFile,
  createYargsForComponentGeneration,
} from '../helpers'

const REDWOOD_WEB_PATH_NAME = 'components'

export const files = ({ name, ...options }) => {
  const isJavascript = options.javascript && !options.typescript
  const componentFile = templateForComponentFile({
    name,
    webPathSection: REDWOOD_WEB_PATH_NAME,
    extension: isJavascript ? '.js' : '.tsx',
    generator: 'component',
    templatePath: 'component.tsx.template',
  })
  const testFile = templateForComponentFile({
    name,
    extension: `.test.${isJavascript ? 'js' : 'tsx'}`,
    webPathSection: REDWOOD_WEB_PATH_NAME,
    generator: 'component',
    templatePath: 'test.tsx.template',
  })
  const storiesFile = templateForComponentFile({
    name,
    extension: `.stories.${isJavascript ? 'js' : 'tsx'}`,
    webPathSection: REDWOOD_WEB_PATH_NAME,
    generator: 'component',
    templatePath: 'stories.tsx.template',
  })

  // Returns
  // {
  //    "path/to/fileA": "<<<template>>>",
  //    "path/to/fileB": "<<<template>>>",
  // }
  return [componentFile, testFile, storiesFile].reduce(
    (acc, [outputPath, content]) => {
      const template = isJavascript
        ? transformTSToJS(outputPath, content)
        : content

      return {
        [outputPath]: template,
        ...acc,
      }
    },
    {}
  )
}

export const description = 'Generate a component'

export const { command, builder, handler } = createYargsForComponentGeneration({
  componentName: 'component',
  filesFn: files,
})
