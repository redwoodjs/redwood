import fs from 'fs'
import path from 'path'

import execa from 'execa'
import Listr from 'listr'

import { getPaths } from 'src/lib'
import c from 'src/lib/colors'

export const command = 'a11y'
export const description = 'Build accessible websites with this a11y setup'
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

const WEB_INDEX_PATH = path.join(getPaths().web.src, 'index.js')

const axeCoreReactConfig = [
  // add comments, before and after (like the tailwind setup command)?
  //
  '\n',
  "if (process.env.NODE_ENV === 'development') {",
  "  const axe = require('@axe-core/react')",
  '  axe(React, ReactDOM, 1000)',
  '}',
  '\n',
]

const configureAxeCoreReact = {
  title: 'Configuring @axe-core/react...',
  task: () => {
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
