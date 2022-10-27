const path = require('path')

const { getPaths } = require('@redwoodjs/internal/dist/paths')

const rwjsPaths = getPaths()

module.exports = async function () {
  if (process.env.SKIP_DB_PUSH !== '1') {
    const process = require('process')
    // Load dotenvs
    require('dotenv-defaults/config')

    const cacheDirDb = `file:${path.join(__dirname, '.redwood', 'test.db')}`
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || cacheDirDb

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
      },
    })
  }
}
