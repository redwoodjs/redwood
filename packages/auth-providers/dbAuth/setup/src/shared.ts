import fs from 'node:fs'

import { getDMMF } from '@prisma/internals'
import execa from 'execa'

import { getPaths } from '@redwoodjs/cli-helpers'
import { processPagesDir } from '@redwoodjs/project-config'

export const libPath = getPaths().api.lib.replace(getPaths().base, '')
export const functionsPath = getPaths().api.functions.replace(
  getPaths().base,
  '',
)

export async function hasModel(name: string) {
  if (!name) {
    return false
  }

  // Support PascalCase, camelCase, kebab-case, UPPER_CASE, and lowercase model
  // names
  const modelName = name.replace(/[_-]/g, '').toLowerCase()

  const schema = await getDMMF({ datamodelPath: getPaths().api.dbSchema })

  for (const model of schema.datamodel.models) {
    if (model.name.toLowerCase() === modelName) {
      return true
    }
  }

  return false
}

export function addModels(models: string) {
  const schema = fs.readFileSync(getPaths().api.dbSchema, 'utf-8')

  const schemaWithUser = schema + models

  fs.writeFileSync(getPaths().api.dbSchema, schemaWithUser)
}

export function hasAuthPages() {
  const routes = fs.readFileSync(getPaths().web.routes, 'utf-8')

  // If the user already has a route for /login, /signin, or /signup, we
  // assume auth pages are already set up
  if (/path={?['"]\/(login|signin|signup)['"]}? /i.test(routes)) {
    return true
  }

  return processPagesDir().some((page) => {
    if (
      page.importName === 'LoginPage' ||
      page.importName === 'LogInPage' ||
      page.importName === 'SigninPage' ||
      page.importName === 'SignInPage' ||
      page.importName === 'SignupPage' ||
      page.importName === 'SignUpPage'
    ) {
      return true
    }

    return false
  })
}

export function generateAuthPagesTask(generatingUserModel: boolean) {
  return {
    title: 'Adding dbAuth pages...',
    task: async () => {
      const rwjsPaths = getPaths()

      const args = ['rw', 'g', 'dbAuth']

      if (generatingUserModel) {
        args.push(
          '--username-label',
          'username',
          '--password-label',
          'password',
        )
      }

      await execa('yarn', args, {
        stdio: 'inherit',
        shell: true,
        cwd: rwjsPaths.base,
      })
    },
  }
}
