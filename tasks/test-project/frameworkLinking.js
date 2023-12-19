/* eslint-env node, es6*/
const execa = require('execa')

const addFrameworkDepsToProject = (frameworkPath, projectPath, stdio) => {
  return execa('yarn project:deps', {
    cwd: frameworkPath,
    shell: true,
    stdio: stdio ? stdio : 'inherit',
    env: {
      RWFW_PATH: frameworkPath,
      RWJS_CWD: projectPath,
    },
  })
}

const copyFrameworkPackages = (frameworkPath, projectPath, stdio) => {
  return execa('yarn project:copy', {
    cwd: frameworkPath,
    shell: true,
    stdio: stdio ? stdio : 'inherit',
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
