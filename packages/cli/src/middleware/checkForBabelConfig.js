import boxen from 'boxen'
import fg from 'fast-glob'

import { getPaths } from '@redwoodjs/internal'

import c from '../lib/colors'

const isUsingBabelRc = () => {
  return (
    fg.sync('**/*/.babelrc(.*)?', {
      cwd: getPaths().base,
      ignore: 'node_modules',
    }).length > 0
  )
}
const BABEL_SETTINGS_LINK = c.warning('https://redwoodjs.com/docs/builds')

const checkForBabelConfig = () => {
  return
  if (isUsingBabelRc()) {
    const messages = [
      "Looks like you're trying to configure one of your sides with a .babelrc file.",
      'These settings will be ignored, unless you use a babel.config.js file',
      '',
      'Your plugins and settings will be automatically merged with',
      `the Redwood built-in config, more details here: ${BABEL_SETTINGS_LINK}`,
    ]
    const errTitle = 'Incorrect project configuration'
    console.log(
      boxen(messages.join('\n'), {
        title: errTitle,
        padding: { top: 0, bottom: 0, right: 1, left: 1 },
        margin: 1,
        borderColor: 'red',
      })
    )
    throw new Error(errTitle)
  }
}

export default checkForBabelConfig
