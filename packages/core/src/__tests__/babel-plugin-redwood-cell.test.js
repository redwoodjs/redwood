import path from 'path'

import pluginTester from 'babel-plugin-tester'

import redwoodCellPlugin from '../babel-plugin-redwood-cell'

pluginTester({
  plugin: redwoodCellPlugin,
  pluginName: 'Redwood Cell',
  fixtures: path.join(__dirname, '__fixtures__'),
})
