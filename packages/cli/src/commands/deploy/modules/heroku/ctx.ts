import path from 'path'

import fs from 'fs-extra'

import { getPaths } from '../../../../lib'

import { HerokuApi } from './api'
import { createBoxen } from './messages'
import { PREDEPLOY_CHOICES, type IPredeployChoices } from './predeploy'
import {
  type BuiltSpawner,
  buildSpawner,
  createLogger,
  writeStdout,
} from './stdio'

export interface IYargs {
  appName: string
  defaults: boolean
  debug?: boolean
  destroy: string
}

export interface IHerokuContext extends IYargs {
  projectPath: string
  appUrl?: string
  prereqs?: IPrereqs
  logger: ReturnType<typeof createLogger>
  spawn: BuiltSpawner
  predeploySteps: IPredeployChoices[]
}

export interface IPrereqs {
  isDarwin?: boolean
  isX64?: boolean
  isGitRepo?: boolean
  isGitClean?: boolean
  isUniqueName?: boolean
  isPackageJsonClean?: boolean
  isPrismaConfigured?: boolean
  hasHomeRoute?: boolean
}

export const DEFAULT_PREREQS: IPrereqs = {
  isX64: true,
  isDarwin: true,
  isGitRepo: false,
  isGitClean: false,
  isUniqueName: true,
  isPackageJsonClean: false,
  isPrismaConfigured: false,
  hasHomeRoute: false,
}

export async function createContextStep(
  yargs: IYargs
): Promise<IHerokuContext> {
  const paths = getPaths()
  const projectName = path.basename(paths.base)
  const spawn = buildSpawner(paths.base, yargs.debug)
  const hasHomeRoute = _hasHomeRoute(paths.base)
  const defaultCtx = {
    ...yargs,
    appName: yargs.appName || projectName,
    projectPath: paths.base,
    spawn,
    logger: createLogger(yargs.debug),
    prereqs: {
      ...DEFAULT_PREREQS,
      hasHomeRoute,
    },
    predeploySteps: PREDEPLOY_CHOICES,
  }

  if (yargs.destroy) {
    await spawn(
      `heroku apps:destroy ${yargs.destroy} --confirm ${yargs.destroy}`
    )
    writeStdout(createBoxen(`Destroyed ${yargs.destroy}`, '💣'))
    process.exit(0)
  }

  if (yargs.defaults) {
    return defaultCtx
  }

  const prereqs = await _gatherSystemInfo(defaultCtx)
  const isUniqueName = await _isUniqueName(defaultCtx)
  const ctx = {
    ...defaultCtx,
    prereqs: {
      ...prereqs,
      isUniqueName,
    },
  }
  ctx.logger.debug(JSON.stringify(ctx, null, 2))
  return ctx
}

async function _gatherSystemInfo(ctx: IHerokuContext): Promise<IPrereqs> {
  const isDarwin = process.platform === 'darwin'
  const isX64 = process.arch === 'x64'
  const isGitRepo = await ctx.spawn('git rev-parse --is-inside-work-tree', {
    reject: false,
  })
  const gitStatus = await ctx.spawn('git status --short', {
    reject: false,
  })
  const isPackageJsonClean = _isPackageJsonClean(ctx.projectPath)
  const isPrismaConfigured = _isPrismaConfigured(ctx.projectPath)
  return {
    isDarwin,
    isX64,
    isGitRepo: isGitRepo === 'true',
    isGitClean: isGitRepo ? gitStatus === '' : false,
    isPackageJsonClean,
    isPrismaConfigured,
  }
}

function _isPackageJsonClean(projectPath: string): boolean {
  try {
    const packageJson = _loadPackageJson(projectPath)
    if (_alreadyHasScripts(packageJson)) {
      return false
    }
    return true
  } catch (err: any) {
    return false
  }
}

export function _loadPackageJson(projectPath: string): any {
  const packageJsonPath = path.join(projectPath, 'package.json')
  const json = fs.readJsonSync(packageJsonPath, 'utf8')
  return json
}

function _alreadyHasScripts(packageJson: Record<string, any>): boolean {
  return packageJson?.scripts && Object.keys(packageJson.scripts).length
}

function _isPrismaConfigured(projectPath: string): boolean {
  const schemaPath = path.join(projectPath, 'api/db/schema.prisma')
  const schemaPrisma = fs.readFileSync(schemaPath, 'utf8')
  const alreadySet = schemaPrisma?.match(/provider = "postgresql"/)?.[0] || ''
  return !!alreadySet
}

async function _isUniqueName(ctx: IHerokuContext): Promise<boolean> {
  const apps = await HerokuApi.apps(ctx)
  try {
    const json = JSON.parse(apps.toString())
    return _isUnique(ctx.appName, json)
  } catch (err: any) {
    const matched = apps.toString().match(/\[[^\][]*]/)
    const json = matched ? JSON.parse(matched[0]) : []
    return _isUnique(ctx.appName, json)
  }
}

function _isUnique(curName: string, json: Record<string, any>): boolean {
  return !json.map((app: any) => app.name).includes(curName)
}

function _hasHomeRoute(projectPath: string): boolean {
  const routesPath = path.join(projectPath, 'web/src/Routes.tsx')
  const routesFile = fs.readFileSync(routesPath, 'utf8')
  const hasHomeRoute = /path="\/"/.test(routesFile)
  return hasHomeRoute
}

export function isAnyStepDisabled(ctx: IHerokuContext): boolean {
  return ctx.predeploySteps.some((step) => !step.enabled)
}
