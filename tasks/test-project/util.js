/* eslint-env node, es6*/

const path = require('path')

const execa = require('execa')

// Similar to codemods package, but subtly different in where the binary is resolved
const getCommand = () => {
  if (process.platform === 'win32') {
    return 'yarn jscodeshift'
  } else {
    return 'node node_modules/.bin/jscodeshift'
  }
}

async function applyCodemod(codemod, target) {
  const args = [
    '--fail-on-error',
    '-t',
    `${path.resolve(__dirname, 'codemods', codemod)} ${target}`,
    '--parser',
    'tsx',
  ]

  args.push()

  await execa(getCommand(), args, getExecaOptions(path.resolve(__dirname)))
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
