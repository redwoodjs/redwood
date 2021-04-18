import fs from 'fs'

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
    // maybe...
    // configureJestAxe
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
      // maybe...
      // 'jest-axe',
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

// not sure what we need to do for this one yet.
//
// const configureJestAxe = {
//   title 'Configuring Jest Axe',
//   tasks: () => {}
// }
//
// it'd probably be setting up this test:
//
//   const React = require('react')
//   const { render } =  require('react-dom')
//   const App = require('./app')
//
//   const { axe, toHaveNoViolations } = require('jest-axe')
//   expect.extend(toHaveNoViolations)
//
//   it('should demonstrate this matcher`s usage with react', async () => {
//     render(<App/>, document.body)
//     const results = await axe(document.body)
//     expect(results).toHaveNoViolations()
//   })
