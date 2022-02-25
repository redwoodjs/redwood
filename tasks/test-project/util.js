/* eslint-env node, es6*/

const fs = require('fs')
const path = require('path')

const execa = require('execa')

async function applyCodemod(codemod, target) {
  const args = [
    '--fail-on-error',
    '-t',
    `${path.resolve(__dirname, 'codemods', codemod)} ${target}`,
    '--parser',
    'tsx',
    '--verbose=2',
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

const updatePkgJsonScripts = ({ projectPath, scripts }) => {
  const projectPackageJsonPath = path.join(projectPath, 'package.json')
  const projectPackageJson = JSON.parse(
    fs.readFileSync(projectPackageJsonPath, 'utf-8')
  )
  projectPackageJson.scripts = {
    ...projectPackageJson.scripts,
    ...scripts,
  }
  fs.writeFileSync(
    projectPackageJsonPath,
    JSON.stringify(projectPackageJson, undefined, 2)
  )
}

module.exports = {
  getExecaOptions,
  applyCodemod,
  updatePkgJsonScripts,
}
