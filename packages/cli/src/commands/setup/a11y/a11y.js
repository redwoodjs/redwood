import execa from 'execa'
import Listr from 'listr'

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
    configureESLintPluginJSXA11yTask,
    configureAxeCoreReact,
    configureStorybookAddonA11y,
    // configureJestAxe
  ])

  try {
    await tasks.run()
  } catch (e) {
    console.log(c.error(e.message))
  }
}

//------------------------
// tasks
//------------------------

const installPackages = {
  title: 'Installing packages...',
  task: async () => {
    await execa('yarn', [
      'workspace',
      'web',
      'add',
      'eslint-plugin-jsx-a11y',
      '@axe-core/react',
      '@storybook/addon-a11y',
      'jest-axe',
    ])
  },
}

const configureESLintPluginJSXA11yTask = {
  title: 'Configuring eslint-plugin-jsx-a11y...',
  task: () => {
    // in web/package.json
    // or web/.eslintrc.js
    // or...
  },
}

const configureAxeCoreReact = {
  title: 'Configuring @axe-core/react...',
  task: () => {
    // somewhere in in web/index.js...
    // const React = require('react');
    // const ReactDOM = require('react-dom');
    //
    // if (process.env.NODE_ENV === 'development') {
    //   const axe = require('@axe-core/react');
    //   axe(React, ReactDOM, 1000);
    // }
  },
}

const configureStorybookAddonA11y = {
  title: 'Configuring @storybook/addon-a11y...',
  task: () => {
    // add to main.js, in storybook config directory
    //
    // module.exports = {
    //   addons: ['@storybook/addon-a11y'],
    // };
  },
}

// Not sure what we need to do yet.
//
// const configureJestAxe = {
//   title 'Configuring Jest Axe',
//   tasks: () => {}
// }
