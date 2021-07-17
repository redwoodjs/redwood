/* eslint-env node, es6*/

const path = require('path')

const execa = require('execa')

async function applyCodemod(codemod, target) {
  const args = []
  args.push(
    '-t',
    `${path.resolve(__dirname, 'codemods', codemod)} ${target}`,
    '--parser',
    'tsx'
  )

  await execa('yarn transform', args, getExecaOptions(path.resolve(__dirname)))
}

/** @type {(string) => import('execa').Options} */
const getExecaOptions = (cwd) => ({
  shell: true,
  stdio: ['ignore', 'pipe', 'inherit'],
  cleanup: true,
  cwd,
})

module.exports = {
  getExecaOptions,
  applyCodemod,
}
