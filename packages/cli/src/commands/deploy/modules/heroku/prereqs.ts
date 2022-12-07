import path from 'path'

import fs from 'fs-extra'

import { HEROKU_ERRORS, IHerokuContext } from './interfaces'
import { Questions } from './questions'
import { spawn } from './stdio'

export async function validateSystemStep(
  ctx: IHerokuContext
): Promise<IHerokuContext> {
  if (ctx.skipChecks) {
    ctx.logger.debug('Skipping system checks...')
    return ctx
  }
  ctx.logger.debug('Checking system requirements...')
  if (process.platform === 'win32') {
    throw new Error(HEROKU_ERRORS.IS_WINDOWS)
  }

  const uname = await spawn('uname -m -s')
  const [os, processor] = uname.split(' ')
  if (os !== 'Darwin' || processor !== 'x86_64') {
    throw new Error(HEROKU_ERRORS.NO_SUPPORT)
  }

  await _checkForHeroku()
  await _validatePostgresConfigured(ctx)
  await _validateGit(ctx)
  return ctx
}

async function _checkForHeroku(): Promise<void> {
  const hasDefaultBin = await spawn(`command -v heroku`)
  if (!hasDefaultBin) {
    throw new Error(HEROKU_ERRORS.NO_HEROKU)
  }
}

async function _validatePostgresConfigured(ctx: IHerokuContext): Promise<void> {
  const schemaPath = path.join(ctx.projectPath, 'api/db/schema.prisma')
  const schemaPrisma = fs.readFileSync(schemaPath, 'utf8')
  const alreadySet = schemaPrisma.match(/provider = "postgresql"/)?.[0] || ''

  if (!alreadySet) {
    const shouldContinue = await Questions.shouldEditSchema()
    if (!shouldContinue) {
      throw new Error(HEROKU_ERRORS.NO_POSTGRES)
    }
    const updatedSchema = schemaPrisma.replace(
      /provider = "(.*?)"/,
      'provider = "postgresql"'
    )
    fs.writeFileSync(schemaPath, updatedSchema)
  }
}

async function _validateGit(ctx: IHerokuContext): Promise<IHerokuContext> {
  const isInGit = await spawn('git rev-parse --is-inside-git-dir', {
    reject: false,
  })
  if (!isInGit) {
    const shouldInit = await Questions.shouldInitGit(ctx)
    if (!shouldInit) {
      throw new Error('Project must be a git repository to deploy to Heroku')
    }
    await _initAndCommit()
  }
  const gitNotClean = await spawn('git status --short')

  if (gitNotClean) {
    const shouldCommit = await Questions.shouldCommitChanges(ctx)
    if (!shouldCommit) {
      throw new Error('Project must be clean to deploy to Heroku')
    }
    await _commit()
  }

  return ctx
}

async function _initAndCommit() {
  await spawn('git init')
  await _commit()
}

async function _commit() {
  await spawn('git add .', { shell: true })
  await spawn(`git commit -m 'initial commit for heroku deploy'`, {
    shell: true,
  })
}
