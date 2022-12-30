import path from 'path'

import fs from 'fs-extra'

import { colors } from '../../../../lib'

import { type IHerokuContext, isAnyStepDisabled } from './ctx'
import { createBoxen } from './messages'
import { sleep, clearStdout } from './stdio'

const DEPENDENCIES = ['pm2']

export async function predeployStep(
  ctx: IHerokuContext
): Promise<IHerokuContext> {
  clearStdout(createBoxen(colors.yellow('Getting ducks in a row'), '🦆🦆🦆'))
  await _initGit(ctx)
  _copyTemplates(ctx)
  await _installModules(ctx, DEPENDENCIES)
  await _generateHome(ctx)
  _addPackageJsonScripts(ctx)
  _updatePrismaSchema(ctx)
  await _gitAddAndCommit(ctx)
  return ctx
}

function _copyTemplates(ctx: IHerokuContext): void {
  _copyConfigTemplates(ctx)
  _copyScriptTemplates(ctx)
  _copyHerokuSh(ctx)
  return
}

function _copyConfigTemplates(ctx: IHerokuContext): void {
  const templatesPath = path.join(__dirname, 'templates')
  if (_shouldRun(ctx, PredeploySteps.COPY_CONFIG_TEMPLATES)) {
    const configTemplatesDir = path.join(templatesPath, 'config')
    const configTemplates = fs.readdirSync(configTemplatesDir)
    for (const file of configTemplates) {
      const src = path.join(configTemplatesDir, file)
      const dest = path.join(ctx.projectPath, `config/${file}`)
      fs.copySync(src, dest)
    }

    const procfileSrc = path.join(templatesPath, 'Procfile')
    const procfileDest = path.join(ctx.projectPath, 'Procfile')
    fs.copySync(procfileSrc, procfileDest)
    clearStdout(createBoxen(colors.yellow('Copied config templates'), '⚙️'))
  }
  return
}

function _copyScriptTemplates(ctx: IHerokuContext): void {
  const templatesPath = path.join(__dirname, 'templates')
  if (_shouldRun(ctx, PredeploySteps.COPY_SCRIPTS_TEMPLATES)) {
    const scriptTemplatesDir = path.join(templatesPath, 'scripts')
    const scriptTemplates = fs.readdirSync(scriptTemplatesDir)
    for (const file of scriptTemplates) {
      const src = path.join(scriptTemplatesDir, file)
      const dest = path.join(ctx.projectPath, `scripts/${file}`)
      fs.copySync(src, dest)
    }
    _makeScriptsExecutable(ctx)
    clearStdout(createBoxen(colors.yellow('Copied script templates'), '📝'))
  }
  return
}

// if they selected to choose the steps individually
// lets give them a reference script for deployment
function _copyHerokuSh(ctx: IHerokuContext): void {
  const anyStepDisabled = isAnyStepDisabled(ctx)
  if (anyStepDisabled) {
    const templatesPath = path.join(__dirname, 'templates')
    const herokuShSrc = path.join(templatesPath, 'heroku.sh')
    const herokuShDest = path.join(ctx.projectPath, 'heroku.sh')
    fs.copySync(herokuShSrc, herokuShDest)
    fs.chmodSync(herokuShDest, '775')
  }
  return
}

async function _generateHome(ctx: IHerokuContext): Promise<void> {
  try {
    const shouldGenerate = _shouldRun(ctx, PredeploySteps.GENERATE_HOME_ROUTE)

    if (shouldGenerate && !ctx.prereqs?.hasHomeRoute) {
      await ctx.spawn(`yarn rw g page home /`)
      clearStdout(createBoxen(colors.yellow('Generated home page'), '🏠'))
    }
    return
  } catch (err) {
    clearStdout(
      createBoxen(
        colors.error(
          `Error generating home page!\nYou should expect a 404 page\n\ncontinuing...`
        ),
        '‼️'
      )
    )
    await sleep(3000)
    return
  }
}

function _makeScriptsExecutable(ctx: IHerokuContext): void {
  const entrypointPath = path.join(ctx.projectPath, 'scripts/entrypoint.sh')
  fs.chmodSync(entrypointPath, '775')

  const buildPath = path.join(ctx.projectPath, 'scripts/build.sh')
  fs.chmodSync(buildPath, '775')

  const postButildPath = path.join(ctx.projectPath, 'scripts/postbuild.sh')
  fs.chmodSync(postButildPath, '775')
  return
}

async function _installModules(
  ctx: IHerokuContext,
  modules: string[]
): Promise<void> {
  try {
    const shouldInstall = _shouldRun(ctx, PredeploySteps.INSTALL_DEPS)
    if (shouldInstall) {
      const command = `yarn add ${modules.join(' ')}`
      await ctx.spawn(command, { shell: true })
      clearStdout(
        createBoxen(colors.yellow('Installed required modules'), '🧱')
      )
    }
    return
  } catch (err) {
    throw new Error(`Error installing required modules: ${err}`)
  }
}

function _addPackageJsonScripts(ctx: IHerokuContext): void {
  try {
    const shouldAdd = _shouldRun(ctx, PredeploySteps.UPDATE_PACKAGEJSON_SCRIPTS)
    if (shouldAdd) {
      const packageJsonPath = path.join(ctx.projectPath, 'package.json')
      const json = fs.readJsonSync(packageJsonPath, 'utf8')
      const scripts = json.scripts ?? {}
      const extraScripts = fs.readJSONSync(
        path.join(__dirname, 'templates/add_scripts.json')
      )

      fs.writeJsonSync(
        packageJsonPath,
        { ...json, scripts: { ...scripts, ...extraScripts.scripts } },
        { spaces: 2 }
      )
      clearStdout(createBoxen(colors.yellow('Added extra scripts'), '℞'))
    }
    return
  } catch (err) {
    throw new Error(`Error adding build script: ${err}`)
  }
}

function _updatePrismaSchema(ctx: IHerokuContext): void {
  try {
    const { projectPath, prereqs } = ctx
    const shouldUpdate = _shouldRun(ctx, PredeploySteps.SET_POSTGRES)

    if (shouldUpdate && !prereqs?.isPrismaConfigured) {
      const schemaPath = path.join(projectPath, 'api/db/schema.prisma')
      const schemaPrisma = fs.readFileSync(schemaPath, 'utf8')
      const replaced = schemaPrisma.replace(
        /provider = ".*"/,
        'provider = "postgresql"'
      )
      fs.writeFileSync(schemaPath, replaced)
      clearStdout(createBoxen(colors.yellow('Added postgres provider'), '🐘'))
    }
    return
  } catch (err) {
    throw new Error(`Error updating Prisma schema: ${err}`)
  }
}

async function _initGit(ctx: IHerokuContext): Promise<void> {
  if (!ctx.prereqs?.isGitRepo) {
    await ctx.spawn('git init')
  }
  return
}

async function _gitAddAndCommit(ctx: IHerokuContext): Promise<void> {
  await ctx.spawn('git add .')
  await ctx.spawn(`git commit -m "Heroku deploy commit"`, {
    shell: true,
    reject: false,
  })

  clearStdout(createBoxen(colors.yellow('Git repo is ready'), '🤘🏽'))
  return
}

export interface IPredeployChoices {
  step: PredeploySteps
  title: string
  description?: string
  enabled: boolean
}

function _createDescriptionText(arr: string[]): string {
  return colors.grey(`modifies:\n  - ${arr.join('\n  - ')}`)
}

export enum PredeploySteps {
  INSTALL_DEPS = 'INSTALL_DEPS',
  COPY_CONFIG_TEMPLATES = 'COPY_CONFIG_TEMPLATES',
  COPY_SCRIPTS_TEMPLATES = 'COPY_SCRIPTS_TEMPLATES',
  MAKE_SCRIPTS_EXECUTABLE = 'MAKE_SCRIPTS_EXECUTABLE',
  UPDATE_PACKAGEJSON_SCRIPTS = 'UPDATE_PACKAGE_JSONSCRIPTS',
  GENERATE_HOME_ROUTE = 'GENERATE_HOME_ROUTE',
  SET_POSTGRES = 'SET_POSTGRES',
  SETUP_HEROKU = 'SETUP_HEROKU',
}

export const PREDEPLOY_CHOICES: IPredeployChoices[] = [
  {
    step: PredeploySteps.INSTALL_DEPS,
    title: 'Install heroku specific dependencies',
    description: `Adds ${DEPENDENCIES.join(', ')}`,
    enabled: true,
  },
  {
    step: PredeploySteps.COPY_CONFIG_TEMPLATES,
    title: 'Copy configuration related templates',
    description: _createDescriptionText([
      'Procfile',
      'config/ecosystem.config.js',
      'config/nginx.conf.erb',
    ]),
    enabled: true,
  },
  {
    step: PredeploySteps.COPY_SCRIPTS_TEMPLATES,
    title: 'Copy script related templates',
    description: _createDescriptionText([
      'scripts/entrypoint.sh',
      'scripts/build.sh',
      'scripts/postbuild.sh',
      'scripts/start.js',
    ]),
    enabled: true,
  },
  {
    step: PredeploySteps.UPDATE_PACKAGEJSON_SCRIPTS,
    title: 'Add scripts to package.json',
    description: _createDescriptionText(['package.json']),
    enabled: true,
  },
  {
    step: PredeploySteps.GENERATE_HOME_ROUTE,
    title: 'Generate "/" route',
    description: _createDescriptionText(['web/src/Routes.{js,tsx}']),
    enabled: true,
  },
  {
    step: PredeploySteps.SET_POSTGRES,
    title: 'Set Postgres as Prisma provider',
    description: _createDescriptionText(['api/db/schema.prisma']),
    enabled: true,
  },
  {
    step: PredeploySteps.SETUP_HEROKU,
    title: 'Setup Heroku',
    description: `heroku operations:\n ${[
      '+ create app',
      '+ create postgres',
      '+ buildpack node',
      '+ buildpack nginx',
    ].join('\n -')}`,
    enabled: true,
  },
]

function _shouldRun(ctx: IHerokuContext, step: PredeploySteps): boolean {
  const areAnyDisabled = isAnyStepDisabled(ctx)
  if (!areAnyDisabled) {
    return true
  }
  const isEnabled = ctx.predeploySteps.find((s) => s.step === step)?.enabled
  return isEnabled ?? false
}
