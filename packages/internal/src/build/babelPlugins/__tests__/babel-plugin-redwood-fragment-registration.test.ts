import path from 'path'

import pluginTester from 'babel-plugin-tester'

import redwoodFragmentPlugin from '../babel-plugin-redwood-fragment-registration'

describe('babel-plugin-redwood-fragment-registration', () => {
  pluginTester({
    plugin: redwoodFragmentPlugin,
    pluginName: 'babel-plugin-redwood-fragment-registration',
    fixtures: path.join(__dirname, '__fixtures__/fragment'),
  })
})
