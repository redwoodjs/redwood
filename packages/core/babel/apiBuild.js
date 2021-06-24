/* eslint-env node, commonjs */

const util = require('util')

const exec = util.promisify(require('child_process').exec)
const { getPaths } = require('@redwoodjs/internal')

module.exports.build = () =>
  exec(
    "yarn cross-env NODE_ENV=production babel src --out-dir dist --delete-dir-on-start --extensions .ts,.js --ignore '**/*.test.ts,**/*.test.js,**/__tests__' --source-maps",
    {
      cwd: getPaths().api.base,
    }
  )
