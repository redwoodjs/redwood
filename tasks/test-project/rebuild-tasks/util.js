const fs = require('fs')
const path = require('path')

const execa = require('execa')

/** @type {(string) => import('execa').Options} */
function getExecaOptions(cwd) {
  return {
    shell: true,
    stdio: 'pipe',
    cleanup: true,
    cwd,
    env: {
      RW_PATH: path.join(__dirname, '../../../'),
    },
  }
}

function addModelToPrismaSchema(projectDirectory, schema) {
  const path = `${projectDirectory}/api/db/schema.prisma`
  const current = fs.readFileSync(path)
  fs.writeFileSync(path, `${current}\n\n${schema}`)
}

function fullPath(cwd, name, { addExtension } = { addExtension: true }) {
  if (addExtension) {
    if (name.startsWith('api')) {
      name += '.ts'
    } else if (name.startsWith('web')) {
      name += '.tsx'
    }
  }

  return path.join(cwd, name)
}

function updatePkgJsonScripts({ projectPath, scripts }) {
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

async function execAndStreamRedwoodCommand(task, args, cwd) {
  const subprocess = execa('yarn', ['rw', ...args], getExecaOptions(cwd))
  task.streamFromExeca(subprocess, {
    boxen: { title: 'yarn rw ' + args.join(' ') },
  })
  await subprocess
}

async function execAndStreamCodemod(task, codemod, target) {
  const subprocess = execa(
    'yarn',
    [
      'jscodeshift',
      '--fail-on-error',
      '-t',
      `${path.resolve(__dirname, 'codemods', codemod)} ${target}`,
      '--parser',
      'tsx',
      '--verbose=2',
    ],
    getExecaOptions(path.resolve(__dirname))
  )
  task.streamFromExeca(subprocess, {
    boxen: { title: 'yarn jscodeshift ' + codemod },
  })
  await subprocess
}

module.exports = {
  getExecaOptions,
  fullPath,
  addModelToPrismaSchema,
  updatePkgJsonScripts,
  execAndStreamRedwoodCommand,
  execAndStreamCodemod,
}
