/* eslint-env node, es6*/

const fs = require('fs')
const path = require('path')
const stream = require('stream')

const originalExeca = require('execa')
const prompts = require('prompts')

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

  await originalExeca(
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

// Confirmation prompt when using --no-copyFromFixture --no-link'
async function confirmNoFixtureNoLink(copyFromFixtureOption, linkOption) {
  if (!copyFromFixtureOption && !linkOption) {
    const { checkNoLink } = await prompts(
      {
        type: 'confirm',
        name: 'checkNoLink',
        message:
          'WARNING: You are building a raw project without the `--link` option.' +
          '\nThe new test-project will NOT build with templates from this branch.' +
          '\nInstead it will build using latest release generator template code.' +
          '\nIf not intended, exit and add the `--link` option.' +
          '\nOtherwise, enter "(y)es" to continue:',
      },
      {
        onCancel: () => {
          process.exit(1)
        },
      }
    )
    return checkNoLink
  }
}

const nullStream = new stream.Writable()
nullStream._write = (_chunk, _encoding, next) => {
  next()
}

class ExecaError extends Error {
  constructor({ stdout, stderr, exitCode }) {
    super(`execa failed with exit code ${exitCode}`)
    this.stdout = stdout
    this.stderr = stderr
    this.exitCode = exitCode
  }
}

function execa(...args) {
  const subprocess = originalExeca(...args)
  subprocess.then(({ stdout, stderr, exitCode }) => {
    if (exitCode !== 0) {
      throw new ExecaError({ stdout, stderr, exitCode })
    }
  })
  return subprocess
}

module.exports = {
  getExecaOptions,
  applyCodemod,
  updatePkgJsonScripts,
  confirmNoFixtureNoLink,
  nullStream,
  ExecaError,
  execa,
}
