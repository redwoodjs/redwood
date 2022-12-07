import path from 'path'

import fs from 'fs-extra'

import { Heroku } from './api'
import type { IHerokuContext } from './interfaces'
import { HEROKU_ERRORS } from './interfaces'
import { spawn } from './stdio'

export const TEMPLATES = [
  'config/nginx.conf.erb.template',
  'Procfile.template',
  'pm2.js.template',
  'app.json.template',
]

export async function prepareStep(
  ctx: IHerokuContext
): Promise<IHerokuContext> {
  if (ctx.delete !== undefined) {
    await _handleDelete(ctx)
  }
  await _copyTemplates(ctx)
  await _replacePm2Vars(ctx)
  await _installModules()
  return ctx
}

async function _copyTemplates(ctx: IHerokuContext): Promise<IHerokuContext> {
  if (!ctx.projectPath) {
    throw new Error(HEROKU_ERRORS.MISSING_PROJECT_PATH)
  }
  const copyFromTemplates = await _templateCopier(ctx)
  copyFromTemplates('config/nginx.conf.erb')
  copyFromTemplates('Procfile')
  copyFromTemplates('pm2.js')
  copyFromTemplates('app.json')
  await _replacePm2Vars(ctx)
  return ctx
}

function _templateCopier(ctx: IHerokuContext) {
  return function (name: string) {
    const src = path.join(
      __dirname,
      'templates',
      `${name.endsWith('.template') ? name : `${name}.template`}`
    )
    const dest = path.join(ctx.projectPath as string, name)
    fs.ensureDirSync(path.dirname(dest))
    fs.copyFileSync(src, dest)
  }
}

async function _handleDelete(ctx: IHerokuContext) {
  const nameToDelete = ctx.defaults ? ctx.appName : ctx.delete
  if (!nameToDelete) {
    throw new Error(HEROKU_ERRORS.HANDLE_DELETE)
  }
  const output = await Heroku.destroy(nameToDelete)
  if (output.includes("Couldn't find that app")) {
    throw new Error(`Couldn't find app ${nameToDelete} to delete.`)
  }
  ctx.logger.debug(`Heroku app ${nameToDelete} deleted.`)
  process.exit(0)
}

async function _installModules() {
  try {
    return await spawn('yarn install pm2')
  } catch (err) {
    throw new Error(`Error installing required modules: ${err}`)
  }
}

async function _replacePm2Vars({ appName, projectPath }: IHerokuContext) {
  const pm2Path = path.join(projectPath, 'pm2.js')
  const pm2File = fs.readFileSync(pm2Path, 'utf8')
  const pm2Updated = pm2File.replace(/APP_NAME/g, appName)
  fs.writeFileSync(pm2Path, pm2Updated)
}
