/* eslint-env node, es6*/

const path = require('path')

const execa = require('execa')

async function applyCodemod(codemod, target) {
  const args = [
    '--fail-on-error',
    '-t',
    `${path.resolve(__dirname, 'codemods', codemod)} ${target}`,
    '--parser',
    'tsx',
  ]

  args.push()

  await execa(
    'yarn jscodeshift',
    args,
    getExecaOptions(path.resolve(__dirname))
  )
}

/** @type {(string) => import('execa').Options} */
const getExecaOptions = (cwd) => ({
  shell: true,
  stdio: 'inherit',
  cleanup: true,
  cwd,
  env: {
    RW_PATH: path.join(__dirname, '../../'),
  },
})

module.exports = {
  getExecaOptions,
  applyCodemod,
}
