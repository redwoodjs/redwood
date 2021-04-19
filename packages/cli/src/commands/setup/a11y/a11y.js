import fs from 'fs'
import path from 'path'

import execa from 'execa'
import Listr from 'listr'

import { getPaths } from 'src/lib'
import c from 'src/lib/colors'

export const command = 'a11y'
export const description = 'Setup tooling for building accessible websites'
export const builder = (yargs) => {
  yargs.option('force', {
    alias: 'f',
    default: false,
    description: 'Overwrite existing configuration',
    type: 'boolean',
  })
}

export const handler = async () => {
  const tasks = new Listr([
    installPackages,
    configureAxeCoreReact,
    configureJestAxe,
  ])

  try {
    await tasks.run()
  } catch (e) {
    console.log(c.error(e.message))
  }
}

//------------------------------------------------
// tasks
//------------------------------------------------

const installPackages = {
  title: 'Installing packages...',
  task: async () => {
    await execa('yarn', [
      'workspace',
      'web',
      'add',
      '-D',
      '@axe-core/react',
      'jest-axe',
    ])
  },
}

//------------------------
// @axe-core/react
//------------------------
//
// we need to add this to `web/src/index.js`:
//
//   const React = require('react');
//   const ReactDOM = require('react-dom');
//
//   if (process.env.NODE_ENV === 'development') {
//     const axe = require('@axe-core/react');
//     axe(React, ReactDOM, 1000);
//   }
//
// this is what a vanilla `web/src/index.js` looks like: https://github.com/redwoodjs/redwood/blob/main/packages/create-redwood-app/template/web/src/index.js

const axeCoreReactConfig = [
  // add comments, before and after (like the tailwind setup command)?
  //
  '\n// START --- yarn rw setup a11y',
  '//',
  '// `yarn rw setup a11y` placed this code here',
  '// for more information, see: https://github.com/dequelabs/axe-core-npm/tree/develop/packages/react',
  '//',
  "if (process.env.NODE_ENV === 'development') {",
  "  import('@axe-core/react').then((axe) => axe.default(React, ReactDOM, 1000))",
  '}',
  '// END --- yarn rw setup a11y\n',
]

const configureAxeCoreReact = {
  title: 'Configuring @axe-core/react...',
  task: async () => {
    let WEB_INDEX_PATH = getPaths().web.index

    if (!fs.existsSync(WEB_INDEX_PATH)) {
      await execa('yarn', ['rw', 'setup', 'custom-web-index'])
      WEB_INDEX_PATH = getPaths().web.index
    }

    const webIndex = fs.readFileSync(WEB_INDEX_PATH)
    const webIndexWithAxeCoreReact = webIndex + axeCoreReactConfig.join('\n')
    fs.writeFileSync(WEB_INDEX_PATH, webIndexWithAxeCoreReact)
  },
}

//------------------------
// jest-axe
//------------------------
//
// TODO(dom): use writeFileTask instead; take overwrite, js/ts options

const jestAxeConfig = [
  "import { render } from '@redwoodjs/testing'",
  '',
  "import App from './App'",
  '',
  "import { axe, toHaveNoViolations } from 'jest-axe'",
  '',
  'expect.extend(toHaveNoViolations)',
  "describe('App', () => {",
  "  it('should not have any a11y violations', async () => {",
  '    const { container } = render(<App />)',
  '    const results = await axe(container)',
  '    expect(results).toHaveNoViolations()',
  '  })',
  '})',
  '\n',
]

const WEB_SRC_PATH = getPaths().web.src

const configureJestAxe = {
  title: 'Configuring jest-axe',
  task: () => {
    fs.writeFileSync(
      path.join(WEB_SRC_PATH, 'App.test.js'),
      jestAxeConfig.join('\n')
    )
  },
}
