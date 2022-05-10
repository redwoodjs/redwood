import * as baremetal from '../baremetal'

describe('verifyServerConfig', () => {
  it('throws an error if host is missing', () => {
    expect(() =>
      baremetal.verifyServerConfig({
        path: '/var/www/app',
        repo: 'git://github.com',
      })
    ).toThrow(
      '"host" config option not set. See https://redwoodjs.com/docs/deployment/baremetal#deploytoml'
    )
  })

  it('throws an error if path is missing', () => {
    expect(() =>
      baremetal.verifyServerConfig({
        host: 'host.test',
        repo: 'git://github.com',
      })
    ).toThrow(
      '"path" config option not set. See https://redwoodjs.com/docs/deployment/baremetal#deploytoml'
    )
  })

  it('throws an error if repo is missing', () => {
    expect(() =>
      baremetal.verifyServerConfig({
        host: 'host.test',
        path: '/var/www/app',
      })
    ).toThrow(
      '"repo" config option not set. See https://redwoodjs.com/docs/deployment/baremetal#deploytoml'
    )
  })

  it('returns true if no problems', () => {
    expect(
      baremetal.verifyServerConfig({
        host: 'host.test',
        path: '/var/www/app',
        repo: 'git://github.com',
      })
    ).toEqual(true)
  })
})

describe('maintenanceTasks', () => {
  it('returns tasks to put maintenance page up', () => {
    const tasks = baremetal.maintenanceTasks(
      'up',
      {},
      { path: '/var/www/app', processNames: ['api'] }
    )

    expect(tasks.length).toEqual(2)
    expect(tasks[0].title).toMatch('Enabling')
    expect(tasks[1].title).toMatch('Stopping')
  })

  it('returns tasks to take maintenance page down', () => {
    const tasks = baremetal.maintenanceTasks(
      'down',
      {},
      { path: '/var/www/app', processNames: ['api'] }
    )

    expect(tasks.length).toEqual(2)
    expect(tasks[0].title).toMatch('Starting')
    expect(tasks[1].title).toMatch('Disabling')
  })
})

describe('rollbackTasks', () => {
  it('returns rollback tasks', () => {
    const tasks1 = baremetal.rollbackTasks(
      1,
      {},
      { path: '/var/www/app', processNames: ['api'] }
    )

    expect(tasks1.length).toEqual(2)
    expect(tasks1[0].title).toMatch('Rolling back 1')
    expect(tasks1[1].title).toMatch('Restarting')

    const tasks2 = baremetal.rollbackTasks(
      5,
      {},
      { path: '/var/www/app', processNames: ['api'] }
    )

    expect(tasks2[0].title).toMatch('Rolling back 5')
  })
})

describe('serverConfigWithDefaults', () => {
  it('provides some default settings', () => {
    const config = baremetal.serverConfigWithDefaults({}, {})
    expect(config).toEqual(baremetal.DEFAULT_SERVER_CONFIG)
  })

  it('overrides defaults with custom', () => {
    const serverConfig = {
      branch: 'venus',
      packageManagerCommand: 'npm',
      monitorCommand: 'god',
      sides: ['native', 'cli'],
      keepReleases: 2,
    }
    const config = baremetal.serverConfigWithDefaults(serverConfig, {})
    expect(config).toEqual(serverConfig)
  })

  it('provides default branch name', () => {
    const config = baremetal.serverConfigWithDefaults({}, {})
    expect(config.branch).toEqual('main')
  })

  it('overrides branch name from config', () => {
    const config = baremetal.serverConfigWithDefaults({ branch: 'earth' }, {})
    expect(config.branch).toEqual('earth')
  })

  it('overrides branch name from yargs no matter what', () => {
    const config = baremetal.serverConfigWithDefaults(
      { branch: 'earth' },
      { branch: 'moon' }
    )
    expect(config.branch).toEqual('moon')
  })
})

describe('parseConfig', () => {
  it('returns empty objects if no lifecycle defined', () => {
    const { _envConfig, envLifecycle } = baremetal.parseConfig(
      { environment: 'production' },
      `
        [[servers]]
        host = 'server.com'
      `
    )

    expect(envLifecycle.before).toEqual({})
    expect(envLifecycle.after).toEqual({})
  })

  it('parses a single global lifecycle event', () => {
    const { _envConfig, envLifecycle } = baremetal.parseConfig(
      { environment: 'production' },
      `
        [before]
        install = 'yarn global'

        [[servers]]
        host = 'server.com'
      `
    )

    expect(envLifecycle.before).toEqual({ install: ['yarn global'] })
    expect(envLifecycle.after).toEqual({})
  })

  it('parses multiple global lifecycle events', () => {
    const { _envConfig, envLifecycle } = baremetal.parseConfig(
      { environment: 'production' },
      `
        [before]
        install = 'yarn global one'
        update = 'yarn global two'

        [[servers]]
        host = 'server.com'
      `
    )

    expect(envLifecycle.before).toEqual({
      install: ['yarn global one'],
      update: ['yarn global two'],
    })
    expect(envLifecycle.after).toEqual({})
  })

  it('parses an array of global lifecycle events', () => {
    const { _envConfig, envLifecycle } = baremetal.parseConfig(
      { environment: 'production' },
      `
        [before]
        install = ['yarn global one', 'yarn global two']

        [[servers]]
        host = 'server.com'
      `
    )

    expect(envLifecycle.before).toEqual({
      install: ['yarn global one', 'yarn global two'],
    })
    expect(envLifecycle.after).toEqual({})
  })

  it('parses an env lifecycle event', () => {
    const { _envConfig, envLifecycle } = baremetal.parseConfig(
      { environment: 'production' },
      `
        [[production.servers]]
        host = 'server.com'

        [production.before]
        install = 'yarn env'
      `
    )

    expect(envLifecycle.before).toEqual({ install: ['yarn env'] })
    expect(envLifecycle.after).toEqual({})
  })

  it('parses combined global and env lifecycle events', () => {
    const { _envConfig, envLifecycle } = baremetal.parseConfig(
      { environment: 'production' },
      `
        [before]
        install = 'yarn global one'

        [[production.servers]]
        host = 'server.com'

        [production.before]
        install = 'yarn env one'
        update = 'yarn env two'
      `
    )

    expect(envLifecycle.before).toEqual({
      install: ['yarn global one', 'yarn env one'],
      update: ['yarn env two'],
    })
    expect(envLifecycle.after).toEqual({})
  })
})

const defaultYargs = {
  update: true,
  install: true,
  migrate: true,
  build: true,
  restart: true,
  cleanup: true,
  releaseDir: '20220409120000',
}
const defaultServerConfig = {
  branch: 'main',
  path: '/var/www/app',
  processNames: ['serve'],
  sides: ['api'],
}

describe('deployTasks', () => {
  it('provides a default list of tasks', () => {
    const tasks = baremetal.deployTasks(
      defaultYargs,
      {}, // ssh
      defaultServerConfig,
      {} // lifecycle
    )

    expect(Object.keys(tasks).length).toEqual(8)
    expect(tasks[0].title).toMatch('Cloning')
    expect(tasks[0].skip()).toEqual(false)
    expect(tasks[1].title).toMatch('Symlink .env')
    expect(tasks[1].skip()).toEqual(false)
    expect(tasks[2].title).toMatch('Installing')
    expect(tasks[2].skip()).toEqual(false)
    expect(tasks[3].title).toMatch('DB Migrations')
    expect(tasks[3].skip()).toEqual(false)
    expect(tasks[4].title).toMatch('Building api')
    expect(tasks[4].skip()).toEqual(false)
    expect(tasks[5].title).toMatch('Symlinking current')
    expect(tasks[5].skip()).toEqual(false)
    expect(tasks[6].title).toMatch('Restarting serve')
    expect(tasks[6].skip()).toEqual(false)
    expect(tasks[7].title).toMatch('Cleaning up')
    expect(tasks[7].skip()).toEqual(false)
  })

  it('builds each side separately', () => {
    const tasks = baremetal.deployTasks(
      defaultYargs,
      {}, // ssh
      { ...defaultServerConfig, sides: ['api', 'web'] },
      {} // lifecycle
    )

    expect(Object.keys(tasks).length).toEqual(9)
    expect(tasks[4].title).toMatch('Building api')
    expect(tasks[5].title).toMatch('Building web')
  })

  it('skips migrations if migrate = false in config', () => {
    const tasks = baremetal.deployTasks(
      defaultYargs,
      {}, // ssh
      { ...defaultServerConfig, migrate: false },
      {} // lifecycle
    )

    expect(Object.keys(tasks).length).toEqual(8)
    expect(tasks[3].skip()).toEqual(true)
  })

  it('starts pm2 if --first-run flag set', () => {
    const tasks = baremetal.deployTasks(
      { ...defaultYargs, firstRun: true },
      {}, // ssh
      defaultServerConfig,
      {} // lifecycle
    )

    expect(Object.keys(tasks).length).toEqual(9)
    expect(tasks[6].title).toMatch('Starting serve')
    expect(tasks[7].title).toMatch('Saving serve')
  })

  it('skips clone and symlinks if --no-update flag passed', () => {
    const tasks = baremetal.deployTasks(
      { ...defaultYargs, update: false },
      {}, // ssh
      defaultServerConfig,
      {} // lifecycle
    )

    expect(tasks[0].skip()).toEqual(true)
    expect(tasks[1].skip()).toEqual(true)
    expect(tasks[5].skip()).toEqual(true)
  })

  it('skips install if --no-install flag passed', () => {
    const tasks = baremetal.deployTasks(
      { ...defaultYargs, install: false },
      {}, // ssh
      defaultServerConfig,
      {} // lifecycle
    )

    expect(tasks[2].skip()).toEqual(true)
  })

  it('skips migrations if --no-migrate flag passed', () => {
    const tasks = baremetal.deployTasks(
      { ...defaultYargs, migrate: false },
      {}, // ssh
      defaultServerConfig,
      {} // lifecycle
    )

    expect(tasks[3].skip()).toEqual(true)
  })

  it('skips build if --no-build flag passed', () => {
    const tasks = baremetal.deployTasks(
      { ...defaultYargs, build: false },
      {}, // ssh
      defaultServerConfig,
      {} // lifecycle
    )

    expect(tasks[4].skip()).toEqual(true)
  })

  it('skips restart if --no-restart flag passed', () => {
    const tasks = baremetal.deployTasks(
      { ...defaultYargs, restart: false },
      {}, // ssh
      defaultServerConfig,
      {} // lifecycle
    )

    expect(tasks[6].skip()).toEqual(true)
  })

  it('skips cleanup if --no-cleanup flag passed', () => {
    const tasks = baremetal.deployTasks(
      { ...defaultYargs, cleanup: false },
      {}, // ssh
      defaultServerConfig,
      {} // lifecycle
    )

    expect(tasks[7].skip()).toEqual(true)
  })

  it('injects a before update event', () => {
    const tasks = baremetal.deployTasks(
      defaultYargs,
      {}, // ssh
      defaultServerConfig,
      { before: { update: ['touch before-update.txt'] } }
    )

    expect(Object.keys(tasks).length).toEqual(9)
    expect(tasks[0].title).toMatch('Before update: `touch before-update.txt`')
    expect(tasks[0].skip).toEqual(false)
    expect(tasks[1].title).toMatch('Cloning')
    expect(tasks[2].title).toMatch('Symlink .env')
  })

  it('injects an after update event', () => {
    const tasks = baremetal.deployTasks(
      defaultYargs,
      {}, // ssh
      defaultServerConfig,
      { after: { update: ['touch after-update.txt'] } }
    )

    expect(Object.keys(tasks).length).toEqual(9)
    expect(tasks[0].title).toMatch('Cloning')
    expect(tasks[1].title).toMatch('After update: `touch after-update.txt`')
    expect(tasks[1].skip).toEqual(false)
    expect(tasks[2].title).toMatch('Symlink .env')
  })

  it('injects multiple before update events', () => {
    const tasks = baremetal.deployTasks(
      defaultYargs,
      {}, // ssh
      defaultServerConfig,
      {
        before: {
          update: ['touch before-update1.txt', 'touch before-update2.txt'],
        },
      }
    )

    expect(Object.keys(tasks).length).toEqual(10)
    expect(tasks[0].title).toMatch('Before update: `touch before-update1.txt`')
    expect(tasks[0].skip).toEqual(false)
    expect(tasks[1].title).toMatch('Before update: `touch before-update2.txt`')
    expect(tasks[1].skip).toEqual(false)
    expect(tasks[2].title).toMatch('Cloning')
  })

  it('injects both before and after update events', () => {
    const tasks = baremetal.deployTasks(
      defaultYargs,
      {}, // ssh
      defaultServerConfig,
      {
        before: {
          update: ['touch before-update.txt'],
        },
        after: {
          update: ['touch after-update.txt'],
        },
      }
    )

    expect(Object.keys(tasks).length).toEqual(10)
    expect(tasks[0].title).toMatch('Before update: `touch before-update.txt`')
    expect(tasks[0].skip).toEqual(false)
    expect(tasks[1].title).toMatch('Cloning')
    expect(tasks[2].title).toMatch('After update: `touch after-update.txt`')
    expect(tasks[2].skip).toEqual(false)
  })

  it('skips lifecycle event if update is skipped', () => {
    const tasks = baremetal.deployTasks(
      { ...defaultYargs, update: false },
      {}, // ssh
      defaultServerConfig,
      {
        before: {
          update: ['touch before-update.txt'],
        },
      }
    )

    expect(Object.keys(tasks).length).toEqual(9)
    expect(tasks[0].title).toMatch('Before update: `touch before-update.txt`')
    expect(tasks[0].skip).toEqual(true)
    expect(tasks[1].title).toMatch('Cloning')
  })

  it('injects a before install event', () => {
    const tasks = baremetal.deployTasks(
      defaultYargs,
      {}, // ssh
      defaultServerConfig,
      { before: { install: ['touch before-install.txt'] } }
    )

    expect(Object.keys(tasks).length).toEqual(9)
    expect(tasks[2].title).toMatch('Before install: `touch before-install.txt`')
    expect(tasks[2].skip).toEqual(false)
    expect(tasks[3].title).toMatch('Install')
  })

  it('injects an after install event', () => {
    const tasks = baremetal.deployTasks(
      defaultYargs,
      {}, // ssh
      defaultServerConfig,
      { after: { install: ['touch after-install.txt'] } }
    )

    expect(Object.keys(tasks).length).toEqual(9)
    expect(tasks[2].title).toMatch('Install')
    expect(tasks[3].title).toMatch('After install: `touch after-install.txt`')
    expect(tasks[3].skip).toEqual(false)
  })

  it('injects a before migrate event', () => {
    const tasks = baremetal.deployTasks(
      defaultYargs,
      {}, // ssh
      defaultServerConfig,
      { before: { migrate: ['touch before-migrate.txt'] } }
    )

    expect(Object.keys(tasks).length).toEqual(9)
    expect(tasks[3].title).toMatch('Before migrate: `touch before-migrate.txt`')
    expect(tasks[4].title).toMatch('DB Migrations')
  })

  it('skips lifecycle event if install is skipped in server config', () => {
    const tasks = baremetal.deployTasks(
      { ...defaultYargs, install: false },
      {}, // ssh
      defaultServerConfig,
      { after: { install: ['touch after-install.txt'] } }
    )

    expect(Object.keys(tasks).length).toEqual(9)
    expect(tasks[2].title).toMatch('Install')
    expect(tasks[3].title).toMatch('After install: `touch after-install.txt`')
    expect(tasks[3].skip).toEqual(true)
  })

  it('injects an after migrate event', () => {
    const tasks = baremetal.deployTasks(
      defaultYargs,
      {}, // ssh
      defaultServerConfig,
      { after: { migrate: ['touch after-migrate.txt'] } }
    )

    expect(Object.keys(tasks).length).toEqual(9)
    expect(tasks[3].title).toMatch('DB Migrations')
    expect(tasks[4].title).toMatch('After migrate: `touch after-migrate.txt`')
    expect(tasks[4].skip).toEqual(false)
  })

  it('skips lifecycle event if migrations are skipped in server config', () => {
    const tasks = baremetal.deployTasks(
      defaultYargs,
      {}, // ssh
      { ...defaultServerConfig, migrate: false },
      { before: { migrate: ['touch before-migrate.txt'] } }
    )

    expect(Object.keys(tasks).length).toEqual(9)
    expect(tasks[3].title).toMatch('Before migrate: `touch before-migrate.txt`')
    expect(tasks[3].skip).toEqual(true)
    expect(tasks[4].title).toMatch('DB Migrations')
  })

  it('skips lifecycle event if migrations are skipped in yargs', () => {
    const tasks = baremetal.deployTasks(
      { ...defaultYargs, migrate: false },
      {}, // ssh
      defaultServerConfig,
      { before: { migrate: ['touch before-migrate.txt'] } }
    )

    expect(Object.keys(tasks).length).toEqual(9)
    expect(tasks[3].title).toMatch('Before migrate: `touch before-migrate.txt`')
    expect(tasks[3].skip).toEqual(true)
    expect(tasks[4].title).toMatch('DB Migrations')
  })

  it('injects a before build event', () => {
    const tasks = baremetal.deployTasks(
      defaultYargs,
      {}, // ssh
      defaultServerConfig,
      { before: { build: ['touch before-build.txt'] } }
    )

    expect(Object.keys(tasks).length).toEqual(9)
    expect(tasks[4].title).toMatch('Before build: `touch before-build.txt`')
    expect(tasks[4].skip).toEqual(false)
    expect(tasks[5].title).toMatch('Building api')
  })

  it('injects an after build event', () => {
    const tasks = baremetal.deployTasks(
      defaultYargs,
      {}, // ssh
      defaultServerConfig,
      { after: { build: ['touch after-build.txt'] } }
    )

    expect(Object.keys(tasks).length).toEqual(9)
    expect(tasks[4].title).toMatch('Building api')
    expect(tasks[5].title).toMatch('After build: `touch after-build.txt`')
    expect(tasks[5].skip).toEqual(false)
  })

  it('skips lifecycle event if build is skipped in yargs', () => {
    const tasks = baremetal.deployTasks(
      { ...defaultYargs, build: false },
      {}, // ssh
      defaultServerConfig,
      { before: { build: ['touch before-build.txt'] } }
    )

    expect(Object.keys(tasks).length).toEqual(9)
    expect(tasks[4].title).toMatch('Before build: `touch before-build.txt`')
    expect(tasks[4].skip).toEqual(true)
    expect(tasks[5].title).toMatch('Building api')
  })

  it('injects a before restart event', () => {
    const tasks = baremetal.deployTasks(
      defaultYargs,
      {}, // ssh
      defaultServerConfig,
      { before: { restart: ['touch before-restart.txt'] } }
    )

    expect(Object.keys(tasks).length).toEqual(9)
    expect(tasks[6].title).toMatch('Before restart: `touch before-restart.txt`')
    expect(tasks[6].skip).toEqual(false)
    expect(tasks[7].title).toMatch('Restarting')
  })

  it('injects an after restart event', () => {
    const tasks = baremetal.deployTasks(
      defaultYargs,
      {}, // ssh
      defaultServerConfig,
      { after: { restart: ['touch after-restart.txt'] } }
    )

    expect(Object.keys(tasks).length).toEqual(9)
    expect(tasks[6].title).toMatch('Restarting')
    expect(tasks[7].title).toMatch('After restart: `touch after-restart.txt`')
    expect(tasks[7].skip).toEqual(false)
  })

  it('skips lifecycle event if restart is skipped in yargs', () => {
    const tasks = baremetal.deployTasks(
      { ...defaultYargs, restart: false },
      {}, // ssh
      defaultServerConfig,
      { before: { restart: ['touch before-restart.txt'] } }
    )

    expect(Object.keys(tasks).length).toEqual(9)
    expect(tasks[6].title).toMatch('Before restart: `touch before-restart.txt`')
    expect(tasks[6].skip).toEqual(true)
    expect(tasks[7].title).toMatch('Restarting')
  })

  it('injects a before cleanup event', () => {
    const tasks = baremetal.deployTasks(
      defaultYargs,
      {}, // ssh
      defaultServerConfig,
      { before: { cleanup: ['touch before-cleanup.txt'] } }
    )

    expect(Object.keys(tasks).length).toEqual(9)
    expect(tasks[7].title).toMatch('Before cleanup: `touch before-cleanup.txt`')
    expect(tasks[7].skip).toEqual(false)
    expect(tasks[8].title).toMatch('Cleaning up')
  })

  it('injects an after cleanup event', () => {
    const tasks = baremetal.deployTasks(
      defaultYargs,
      {}, // ssh
      defaultServerConfig,
      { after: { cleanup: ['touch after-cleanup.txt'] } }
    )

    expect(Object.keys(tasks).length).toEqual(9)
    expect(tasks[7].title).toMatch('Cleaning up')
    expect(tasks[8].title).toMatch('After cleanup: `touch after-cleanup.txt`')
    expect(tasks[8].skip).toEqual(false)
  })

  it('skips lifecycle event if cleanup is skipped in yargs', () => {
    const tasks = baremetal.deployTasks(
      { ...defaultYargs, cleanup: false },
      {}, // ssh
      defaultServerConfig,
      { before: { cleanup: ['touch before-cleanup.txt'] } }
    )

    expect(Object.keys(tasks).length).toEqual(9)
    expect(tasks[7].title).toMatch('Before cleanup: `touch before-cleanup.txt`')
    expect(tasks[7].skip).toEqual(true)
    expect(tasks[8].title).toMatch('Cleaning up')
  })
})
