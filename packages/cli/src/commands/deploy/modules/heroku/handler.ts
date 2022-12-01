/* eslint-disable */
import fs from 'fs'
import path from 'path'
import process from 'process'

import { getPaths } from '../../../../lib'

import { authHerokuTask } from './auth'
import { systemRequirementsTask } from './checks'
import { createHerokuAppTask } from './configure'
import { IYargs, IHerokuContext } from './interfaces'
import { Logger } from './stdio'

export async function herokuHandler(yargs: IYargs) {
  try {
    const ctx = _createHerokuContext(yargs)
    await systemRequirementsTask()
    await copyHerokuTemplatesTask(ctx)
    await authHerokuTask(ctx)
    await createHerokuAppTask(ctx)
  } catch (err: any) {
    Logger.error(err.message)
    process.exit(1)
  }
}

async function copyHerokuTemplatesTask({
  paths,
}: IHerokuContext): Promise<void> {
  fs.copyFileSync(
    path.join(__dirname, 'templates', 'app.json.template'),
    path.join(paths.base, 'app.json')
  )
}

function _createHerokuContext(yargs: IYargs): IHerokuContext {
  const paths = getPaths()
  const app = path.basename(paths.base)
  return {
    ...yargs,
    appName: yargs.app || app,
    paths,
  }
}
