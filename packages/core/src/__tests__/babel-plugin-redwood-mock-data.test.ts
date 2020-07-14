import path from 'path'

import pluginTester from 'babel-plugin-tester'

import plugin from '../babel-plugin-redwood-mock-data'

// can we replace dirname here??

pluginTester({
  plugin,
  pluginName: 'babel-plugin-redwood-mock-data',
  fixtures: path.join(__dirname, '__fixtures__/mock-data'),
})
