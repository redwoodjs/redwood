import path from 'path'

// import * as p from '@babel/plugin-syntax-jsx'
import pluginTester from 'babel-plugin-tester'

import redwoodFragmentPlugin from '../babel-plugin-redwood-fragment-registration'

describe('babel-plugin-redwood-fragment-registration', () => {
  pluginTester({
    plugin: redwoodFragmentPlugin,
    babelOptions: { plugins: ['@babel/plugin-syntax-jsx'] },
    pluginName: 'babel-plugin-redwood-fragment-registration',
    fixtures: path.join(__dirname, '__fixtures__/fragment'),
  })
})
