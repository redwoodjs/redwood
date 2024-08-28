import path from 'node:path'

import chalk from 'chalk'
import execa from 'execa'
import fg from 'fast-glob'
import fs from 'fs-extra'
import { rimrafSync } from 'rimraf'

export function buildRedwoodFramework({
  frameworkPath,
  verbose,
}: {
  frameworkPath: string
  verbose: boolean
}) {
  try {
    const files = fg.sync('packages/**/dist', {
      onlyDirectories: true,
    })

    execa.sync(
      [files.length && 'yarn build:clean', 'yarn build']
        .filter(Boolean)
        .join('&&'),
      {
        cwd: frameworkPath,
        shell: true,
        stdio: verbose ? 'inherit' : 'ignore',
      },
    )
  } catch (e) {
    if (e.signal !== 'SIGINT') {
      console.error('Error: Could not build Redwood Framework')
      console.error(e)
    }
    process.exit(1)
  }
}

export function createRedwoodJSApp({
  frameworkPath,
  projectPath,
  typescript,
  verbose,
}: {
  frameworkPath: string
  projectPath: string
  typescript: boolean
  verbose: boolean
}) {
  try {
    execa.sync(
      'yarn node dist/create-redwood-app.js',
      [
        projectPath,
        '--no-yarn-install',
        `--typescript ${typescript}`,
        '--no-telemetry',
        '--no-git',
      ].filter(Boolean),
      {
        cwd: path.join(frameworkPath, 'packages/create-redwood-app'),
        env: { REDWOOD_CI: '1' },
        shell: true,
        stdio: verbose ? 'inherit' : 'ignore',
      },
    )

    // Add prisma resolutions
    const packageJSONPath = path.join(projectPath, 'package.json')
    const packageJSON = fs.readJSONSync(packageJSONPath)

    const getVersionFrmRwPkg = (dep, pkg) => {
      return fs.readJSONSync(
        path.join(frameworkPath, 'packages', pkg, 'package.json'),
      ).dependencies[dep]
    }

    packageJSON.resolutions = {
      prisma: getVersionFrmRwPkg('prisma', 'cli'),
      '@prisma/client': getVersionFrmRwPkg('@prisma/client', 'api'),
      '@prisma/internals': getVersionFrmRwPkg('@prisma/internals', 'cli'),
      'graphql-yoga': getVersionFrmRwPkg('graphql-yoga', 'graphql-server'),
    }

    fs.writeFileSync(packageJSONPath, JSON.stringify(packageJSON, null, 2))
  } catch (e) {
    if (e.signal !== 'SIGINT') {
      console.error('Error: Could not create Redwood Project')
      console.error(e)
    }
    process.exit(1)
  }
}

export function addFrameworkDepsToProject({
  frameworkPath,
  projectPath,
  verbose,
}: {
  frameworkPath: string
  projectPath: string
  verbose: boolean
}) {
  try {
    execa.sync('yarn project:deps', {
      cwd: frameworkPath,
      shell: true,
      stdio: verbose ? 'inherit' : 'ignore',
      env: {
        RWFW_PATH: frameworkPath,
        RWJS_CWD: projectPath,
      },
    })
  } catch (e) {
    if (e.signal !== 'SIGINT') {
      console.error(
        'Error: Could not add Redwood Framework dependencies to project',
      )
      console.error(e)
    }
    process.exit(1)
  }
}

export function copyFrameworkPackages({
  frameworkPath,
  projectPath,
  verbose,
}: {
  frameworkPath: string
  projectPath: string
  verbose: boolean
}) {
  try {
    execa.sync('yarn project:copy', {
      cwd: frameworkPath,
      shell: true,
      stdio: verbose ? 'inherit' : 'ignore',
      env: {
        RWFW_PATH: frameworkPath,
        RWJS_CWD: projectPath,
      },
    })
  } catch (e) {
    if (e.signal !== 'SIGINT') {
      console.error('Error: We could not copy Redwood Framework packages')
      console.error(e)
    }
    process.exit(1)
  }
}

export function runYarnInstall({
  projectPath,
  verbose,
}: {
  projectPath: string
  verbose: boolean
}) {
  try {
    execa.sync('yarn install', {
      cwd: projectPath,
      shell: true,
      stdio: verbose ? 'inherit' : 'ignore',
    })
  } catch (e) {
    if (e.signal !== 'SIGINT') {
      console.error('Error: Could not run `yarn install`')
      console.error(e)
    }
    process.exit(1)
  }
}

export function initGit({
  projectPath,
  verbose,
}: {
  projectPath: string
  verbose: boolean
}) {
  try {
    console.log('Initializing Git')
    execa.sync('git init --initial-branch main && git add .', {
      cwd: projectPath,
      shell: true,
      stdio: verbose ? 'inherit' : 'ignore',
    })
    execa.sync('git commit -a --message=init --no-gpg-sign', {
      cwd: projectPath,
      shell: true,
      stdio: verbose ? 'inherit' : 'ignore',
    })
  } catch (e) {
    if (e.signal !== 'SIGINT') {
      console.error(
        'There was an error with the `git init` or `git commit` step:',
      )
      console.error(e)
    }
    process.exit(1)
  }
}

export function cleanUp({ projectPath }: { projectPath: string }) {
  const divider = chalk.blue('~'.repeat(process.stdout.columns))
  console.log(`\n${divider}`)
  console.log('Cleaning up files (may take a few seconds)...')
  if (fs.existsSync(projectPath)) {
    rimrafSync(path.join(projectPath, '*'), {
      glob: {
        dot: true,
      },
    })
    fs.rmdirSync(projectPath)
  }
  console.log(divider)
}
