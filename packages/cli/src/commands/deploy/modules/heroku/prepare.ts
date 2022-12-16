import path from 'path'

import boxen from 'boxen'
import fs from 'fs-extra'
import prompts from 'prompts'

import { HerokuApi } from './api'
import { HEROKU_ERRORS, type IHerokuContext } from './interfaces'
import { createReadyMessage, createActionsMessages } from './messages'
import { blue } from './stdio'

export async function confirmReadyStep(
  ctx: IHerokuContext
): Promise<IHerokuContext> {
  if (ctx.defaults || ctx.skipChecks) {
    ctx.logger.debug('Skipping feedback. Using defaults')
    return ctx
  }
  const isFatalState = !ctx.prereqs?.isDarwin
  const readyMessage = createReadyMessage(ctx)
  const listOfActions = createActionsMessages(ctx)
  const ready = await _readyDialog(readyMessage, listOfActions, isFatalState)
  if (!ready) {
    process.stdout.write(
      _createBoxen('No prob. Come back when you are ready!', 'Goodbye!')
    )
    process.exit(0)
  }
  return ctx
}

async function _readyDialog(
  message: string,
  listOfActions: string,
  isFatalState: boolean
): Promise<boolean> {
  if (isFatalState) {
    process.stdout.write(
      boxen('Must exit due to unmet conditions', {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
      })
    )
    process.exit(0)
  }
  process.stdout.write(_createBoxen(message, 'Status'))
  process.stdout.write(_createBoxen(listOfActions, 'Changes to make'))

  const { ready } = await prompts({
    type: 'confirm',
    name: 'ready',
    initial: true,
    message: blue('Configure and deploy?'),
  })
  return ready
}

function _createBoxen(message: string, title: string) {
  return boxen(message, {
    title,
    margin: { top: 1, right: 0, bottom: 1, left: 0 },
    padding: { top: 0, right: 1, bottom: 0, left: 1 },
    borderStyle: 'round',
    backgroundColor: '#333',
    float: 'left',
  })
}

export async function prepareStep(
  ctx: IHerokuContext
): Promise<IHerokuContext> {
  ctx.logger.log('Preparing for deployment...')

  if (ctx.delete !== undefined) {
    await _handleDelete(ctx)
  }
  await _copyTemplates(ctx)
  await _replacePm2Vars(ctx)
  // Core needs to be a dependency for remote commands to work
  await _installModules(ctx, ['pm2'])
  await _addBuildScript(ctx)
  await _updatePrismaSchema(ctx)
  return ctx
}

export const TEMPLATES = [
  'config/nginx.conf.erb.template',
  'Procfile.template',
  'pm2.js.template',
  'app.json.template',
]

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
  const output = await HerokuApi.destroy(ctx)
  if (output.includes("Couldn't find that app")) {
    throw new Error(`Couldn't find app ${nameToDelete} to delete.`)
  }
  ctx.logger.debug(`Heroku app ${nameToDelete} deleted.`)
  process.exit(0)
}

async function _installModules({ spawn }: IHerokuContext, modules: string[]) {
  try {
    const command = `yarn workspace web add ${modules.join(' ')}`
    return await spawn(command, { shell: true, stdio: 'inherit' })
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

async function _addBuildScript({ projectPath }: IHerokuContext) {
  try {
    const packageJsonPath = path.join(projectPath, 'package.json')
    const json = fs.readJsonSync(packageJsonPath, 'utf8')
    json.scripts ??= {}
    json.scripts.build = 'yarn rw build'
  } catch (err) {
    throw new Error(`Error adding build script: ${err}`)
  }
}

async function _updatePrismaSchema({ projectPath, prereqs }: IHerokuContext) {
  try {
    if (!prereqs?.isPrismaConfigured) {
      const schemaPath = path.join(projectPath, 'api/db/schema.prisma')
      const schemaPrisma = fs.readFileSync(schemaPath, 'utf8')
      const replaced = schemaPrisma.replace(
        /provider = ".*"/,
        'provider = "postgresql"'
      )
      fs.writeFileSync(schemaPath, replaced)
    }
  } catch (err) {
    throw new Error(`Error updating Prisma schema: ${err}`)
  }
}
