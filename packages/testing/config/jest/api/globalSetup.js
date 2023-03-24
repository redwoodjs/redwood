const { readFileSync } = require('fs')
const path = require('path')

const { getPaths } = require('@redwoodjs/project-config')

const rwjsPaths = getPaths()

const PRISMA_DIRECT_URL_REGEX = /directUrl(\s?)=(\s?)env\(('|")(.*)('|")\)/g
const BETWEEN_PARENTHESES_REGEX = /\(('|")([^)]+)('|")\)/

module.exports = async function () {
  if (process.env.SKIP_DB_PUSH !== '1') {
    const process = require('process')
    // Load dotenvs
    require('dotenv-defaults/config')

    const cacheDirDb = getDefaultDb()
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || cacheDirDb

    checkAndReplaceDirectUrl()

    const command =
      process.env.TEST_DATABASE_STRATEGY === 'reset'
        ? ['prisma', 'migrate', 'reset', '--force', '--skip-seed']
        : ['prisma', 'db', 'push', '--force-reset', '--accept-data-loss']

    const execa = require('execa')
    execa.sync(`yarn rw`, command, {
      cwd: rwjsPaths.api.base,
      stdio: 'inherit',
      shell: true,
      env: {
        DATABASE_URL: process.env.DATABASE_URL,
        DIRECT_URL: process.env.DIRECT_URL,
      },
    })
  }
}

function checkAndReplaceDirectUrl() {
  const prismaSchema = readFileSync(path.join(rwjsPaths.api.dbSchema), 'utf-8')
  const regex = new RegExp(PRISMA_DIRECT_URL_REGEX)
  const cacheDirDb = getDefaultDb()

  // Check Prisma Schema for the existence of a directUrl
  const directUrl = prismaSchema.match(regex)

  if (directUrl[0]) {
    // If it exists, set the env var to the value of the directUrl env var
    const directUrlEnv = directUrl[0].match(BETWEEN_PARENTHESES_REGEX)[2]
    process.env[directUrlEnv] =
      process.env.TEST_DIRECT_URL || process.env.TEST_DATABASE_URL || cacheDirDb
  }
}

function getDefaultDb() {
  return `file:${path.join(__dirname, '.redwood', 'test.db')}`
}
