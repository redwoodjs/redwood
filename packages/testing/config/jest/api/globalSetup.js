const fs = require('fs')
const path = require('path')

const { getPaths } = require('@redwoodjs/project-config')

const {
  getDefaultDb,
  checkAndReplaceDirectUrl,
} = require('../../../src/api/directUrlHelpers')

const rwjsPaths = getPaths()

module.exports = async function () {
  if (process.env.SKIP_DB_PUSH !== '1') {
    const process = require('process')
    // Load dotenvs
    require('dotenv-defaults/config')

    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || getDefaultDb()

    const prismaSchema = fs.readFileSync(
      path.join(rwjsPaths.api.dbSchema),
      'utf-8'
    )

    checkAndReplaceDirectUrl(prismaSchema, getDefaultDb(rwjsPaths.base))

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
