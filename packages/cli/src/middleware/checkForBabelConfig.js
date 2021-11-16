import boxen from 'boxen'
import fg from 'fast-glob'

import {
  getApiSideBabelConfigPath,
  getWebSideBabelConfigPath,
  getPaths,
} from '@redwoodjs/internal'

import c from '../lib/colors'

const isUsingBabelRc = () => {
  return (
    fg.sync('**/*/.babelrc(.*)?', {
      cwd: getPaths().base,
      ignore: 'node_modules',
    }).length > 0
  )
}
const AVOID_PLUGINS_MESSAGE =
  'We encourage users to avoid custom babel plugins, as this maybe removed in future versions.'

const checkForBabelConfig = () => {
  const apiCustomBabelConfig = getApiSideBabelConfigPath()
  const webCustomBabelConfig = getWebSideBabelConfigPath()

  if (apiCustomBabelConfig || webCustomBabelConfig) {
    console.warn(
      c.warning('Headsup! \n') +
        'It looks like you have a babel.config.js in one of your sides. \n' +
        AVOID_PLUGINS_MESSAGE +
        '\n'
    )
  }

  if (isUsingBabelRc()) {
    const messages = [
      'Looks like youre trying to configure one of your sides with a .babelrc file.',
      'These are no longer supported within Redwood',
      '',
      'You can use a babel.config.js file for each side, but...',
      AVOID_PLUGINS_MESSAGE,
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
