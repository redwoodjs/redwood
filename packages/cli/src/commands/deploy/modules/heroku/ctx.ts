import path from 'path'

import fs from 'fs-extra'

import { getPaths } from '../../../../lib'

import { HerokuApi } from './api'
import type { IYargs, IPrereqs, IHerokuContext } from './interfaces'
import { buildSpawner, createLogger } from './stdio'

export async function createContext(yargs: IYargs): Promise<IHerokuContext> {
  const paths = getPaths()
  const projectName = path.basename(paths.base)
  const spawn = buildSpawner(paths.base, yargs.debug)
  const defaultCtx = {
    ...yargs,
    appName: yargs.appName || projectName,
    projectPath: paths.base,
    spawn,
    logger: createLogger(yargs.debug),
    prereqs: null,
  }

  if (yargs.skipChecks) {
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
  const isGitRepo = await ctx.spawn('git rev-parse --is-inside-work-tree')
  const gitStatus = await ctx.spawn('git status --short')
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

export function loadPackageJson(projectPath: string) {
  try {
    const packageJsonPath = path.join(projectPath, 'package.json')
    const json = fs.readJsonSync(packageJsonPath, 'utf8')
    return json
  } catch (err) {
    throw new Error(`Error loading package.json from ${projectPath}`)
  }
}

function _isPackageJsonClean(projectPath: string): boolean {
  const packageJson = loadPackageJson(projectPath)
  if (_alreadyHasScripts(packageJson)) {
    return false
  }
  return true
}

function _alreadyHasScripts(packageJson: Record<string, unknown>) {
  return packageJson.scripts && Object.keys(packageJson.scripts).length > 0
}

function _isPrismaConfigured(projectPath: string): boolean {
  const schemaPath = path.join(projectPath, 'api/db/schema.prisma')
  const schemaPrisma = fs.readFileSync(schemaPath, 'utf8')
  const alreadySet = schemaPrisma.match(/provider = "postgresql"/)?.[0] || ''
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

function _isUnique(curName: string, json: Record<string, any>) {
  return !json.map((app: any) => app.name).includes(curName)
}
