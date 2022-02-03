import fs from 'fs'
import path from 'path'

import boxen from 'boxen'
import execa from 'execa'
import Listr from 'listr'

import {
  getInstalledRedwoodVersion,
  getPaths,
  writeFilesTask,
} from '../../../../lib'

const REDWOOD_TOML_PATH = path.join(getPaths().base, 'redwood.toml')

export const updateApiURLTask = (apiUrl) => {
  return {
    title: 'Updating API URL in redwood.toml...',
    task: () => {
      const redwoodToml = fs.readFileSync(REDWOOD_TOML_PATH).toString()
      let newRedwoodToml = redwoodToml

      if (redwoodToml.match(/apiUrl/)) {
        newRedwoodToml = newRedwoodToml.replace(
          /apiUrl.*/g,
          `apiUrl = "${apiUrl}"`
        )
      } else if (redwoodToml.match(/\[web\]/)) {
        newRedwoodToml = newRedwoodToml.replace(
          /\[web\]/,
          `[web]\n  apiUrl = "${apiUrl}"`
        )
      } else {
        newRedwoodToml += `[web]\n  apiUrl = "${apiUrl}"`
      }

      fs.writeFileSync(REDWOOD_TOML_PATH, newRedwoodToml)
    },
  }
}

/**
 * Use this to create checks prior to runnning setup commands
 * with a better error output
 *
 * @example preRequisiteCheckTask([
    {
      title: 'Checking if xxx is installed...',
      command: ['xxx', ['--version']],
      errorMessage: [
        'Looks like xxx.',
        'Please follow the steps...',
      ],
    },
  ])
 */
export const preRequisiteCheckTask = (preRequisites) => {
  return {
    title: 'Checking pre-requisites',
    task: () =>
      new Listr(
        preRequisites.map((preReq) => {
          return {
            title: preReq.title,
            task: async () => {
              try {
                await execa(...preReq.command)
              } catch (error) {
                error.message =
                  error.message + '\n' + preReq.errorMessage.join(' ')
                throw error
              }
            },
          }
        })
      ),
  }
}

/**
 *
 * Use this util to install dependencies on a user's Redwood app
 *
 * @example addPackagesTask({
 * packages: ['fs-extra', 'somePackage@2.1.0'],
 * side: 'api', // <-- leave empty for project root
 * devDependency: true
 * })
 */
export const addPackagesTask = ({
  packages,
  side = 'project',
  devDependency = false,
}) => {
  const packagesWithSameRWVersion = packages.map((pkg) => {
    if (pkg.includes('@redwoodjs')) {
      return `${pkg}@${getInstalledRedwoodVersion()}`
    } else {
      return pkg
    }
  })

  let installCommand
  // if web,api
  if (side !== 'project') {
    installCommand = [
      'yarn',
      [
        'workspace',
        side,
        'add',
        devDependency && '--dev',
        ...packagesWithSameRWVersion,
      ].filter(Boolean),
    ]
  } else {
    installCommand = [
      'yarn',
      [
        '-W',
        'add',
        devDependency && '--dev',
        ...packagesWithSameRWVersion,
      ].filter(Boolean),
    ]
  }

  return {
    title: `Adding dependencies to ${side}`,
    task: async () => {
      await execa(...installCommand)
    },
  }
}

/**
 *
 * Use this to add files to a users project
 *
 * @example
 * addFilesTask(
 *  files: [ { path: path.join(getPaths().base, 'netlify.toml'), content: NETLIFY_TOML }],
 * )
 */
export const addFilesTask = ({
  files,
  force = false,
  title = 'Adding config',
}) => {
  return {
    title: `${title}...`,
    task: () => {
      let fileNameToContentMap = {}
      files.forEach((fileData) => {
        fileNameToContentMap[fileData.path] = fileData.content
      })
      return writeFilesTask(fileNameToContentMap, { overwriteExisting: force })
    },
  }
}

export const addToGitIgnoreTask = ({ paths }) => {
  return {
    title: 'Updating .gitignore...',
    skip: () => {
      if (!fs.existsSync(path.resolve(getPaths().base, '.gitignore'))) {
        return 'No gitignore present, skipping.'
      }
    },
    task: async (_ctx, task) => {
      const gitIgnore = path.resolve(getPaths().base, '.gitignore')
      const content = fs.readFileSync(gitIgnore).toString()

      if (paths.every((item) => content.includes(item))) {
        task.skip('.gitignore already includes the additions.')
      }

      fs.appendFileSync(gitIgnore, ['\n', '# Deployment', ...paths].join('\n'))
    },
  }
}

export const addToDotEnvTask = ({ lines }) => {
  return {
    title: 'Updating .env...',
    skip: () => {
      if (!fs.existsSync(path.resolve(getPaths().base, '.env'))) {
        return 'No .env present, skipping.'
      }
    },
    task: async (_ctx, task) => {
      const env = path.resolve(getPaths().base, '.env')
      const content = fs.readFileSync(env).toString()

      if (lines.every((line) => content.includes(line.split('=')[0]))) {
        task.skip('.env already includes the additions.')
      }

      fs.appendFileSync(env, lines.join('\n'))
    },
  }
}

export const printSetupNotes = (notes) => {
  return {
    title: 'One more thing...',
    task: (_ctx, task) => {
      task.title = `One more thing...\n\n ${boxen(notes.join('\n'), {
        padding: { top: 1, bottom: 1, right: 1, left: 1 },
        margin: 1,
        borderColour: 'gray',
      })}  \n`
    },
  }
}
