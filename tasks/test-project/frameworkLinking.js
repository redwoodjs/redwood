/* eslint-env node, es6*/
const execa = require('execa')

const addFrameworkDepsToProject = (frameworkPath, projectPath) => {
  return execa('yarn project:deps', {
    cwd: frameworkPath,
    shell: true,
    stdio: 'inherit',
    env: {
      RWFW_PATH: frameworkPath,
      RWJS_CWD: projectPath,
    },
  })
}

const copyFrameworkPackages = (frameworkPath, projectPath) => {
  return execa('yarn project:copy', {
    cwd: frameworkPath,
    shell: true,
    stdio: 'inherit',
    env: {
      RWFW_PATH: frameworkPath,
      RWJS_CWD: projectPath,
    },
  })
}

module.exports = {
  copyFrameworkPackages,
  addFrameworkDepsToProject,
}
