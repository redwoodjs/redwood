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

describe('deployTasks', () => {
  it('provides a default list of tasks', () => {
    const tasks = baremetal.deployTasks(
      {
        update: true,
        install: true,
        migrate: true,
        build: true,
        restart: true,
        cleanup: true,
        releaseDir: '20220409120000',
      },
      {}, // ssh
      {
        branch: 'main',
        path: '/var/www/app',
        processNames: ['serve'],
        sides: ['api'],
      },
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
      {
        update: true,
        install: true,
        migrate: true,
        build: true,
        restart: true,
        cleanup: true,
        releaseDir: '20220409120000',
      },
      {}, // ssh
      {
        branch: 'main',
        path: '/var/www/app',
        processNames: ['serve'],
        sides: ['api', 'web'],
      },
      {} // lifecycle
    )

    expect(Object.keys(tasks).length).toEqual(9)
    expect(tasks[4].title).toMatch('Building api')
    expect(tasks[5].title).toMatch('Building web')
  })

  it('skips migrations if migrate = false in config', () => {
    const tasks = baremetal.deployTasks(
      {
        update: true,
        install: true,
        migrate: true,
        build: true,
        restart: true,
        cleanup: true,
        releaseDir: '20220409120000',
      },
      {}, // ssh
      {
        branch: 'main',
        migrate: false,
        path: '/var/www/app',
        processNames: ['serve'],
        sides: ['api'],
      },
      {} // lifecycle
    )

    expect(Object.keys(tasks).length).toEqual(8)
    expect(tasks[3].skip()).toEqual(true)
  })

  it('starts pm2 if --first-run flag set', () => {
    const tasks = baremetal.deployTasks(
      {
        update: true,
        install: true,
        migrate: true,
        build: true,
        restart: true,
        cleanup: true,
        firstRun: true,
        releaseDir: '20220409120000',
      },
      {}, // ssh
      {
        branch: 'main',
        migrate: false,
        path: '/var/www/app',
        processNames: ['serve'],
        sides: ['api'],
      },
      {} // lifecycle
    )

    expect(Object.keys(tasks).length).toEqual(9)
    expect(tasks[6].title).toMatch('Starting serve')
    expect(tasks[7].title).toMatch('Saving serve')
  })

  it('skips clone and symlinks if --no-update flag passed', () => {
    const tasks = baremetal.deployTasks(
      {
        update: false,
        install: true,
        migrate: true,
        build: true,
        restart: true,
        cleanup: true,
        releaseDir: '20220409120000',
      },
      {}, // ssh
      {
        branch: 'main',
        path: '/var/www/app',
        processNames: ['serve'],
        sides: ['api'],
      },
      {} // lifecycle
    )

    expect(tasks[0].skip()).toEqual(true)
    expect(tasks[1].skip()).toEqual(true)
    expect(tasks[5].skip()).toEqual(true)
  })

  it('skips install if --no-install flag passed', () => {
    const tasks = baremetal.deployTasks(
      {
        update: true,
        install: false,
        migrate: true,
        build: true,
        restart: true,
        cleanup: true,
        releaseDir: '20220409120000',
      },
      {}, // ssh
      {
        branch: 'main',
        path: '/var/www/app',
        processNames: ['serve'],
        sides: ['api'],
      },
      {} // lifecycle
    )

    expect(tasks[2].skip()).toEqual(true)
  })

  it('skips migrations if --no-migrate flag passed', () => {
    const tasks = baremetal.deployTasks(
      {
        update: true,
        install: true,
        migrate: false,
        build: true,
        restart: true,
        cleanup: true,
        releaseDir: '20220409120000',
      },
      {}, // ssh
      {
        branch: 'main',
        path: '/var/www/app',
        processNames: ['serve'],
        sides: ['api'],
      },
      {} // lifecycle
    )

    expect(tasks[3].skip()).toEqual(true)
  })

  it('skips build if --no-build flag passed', () => {
    const tasks = baremetal.deployTasks(
      {
        update: true,
        install: true,
        migrate: true,
        build: false,
        restart: true,
        cleanup: true,
        releaseDir: '20220409120000',
      },
      {}, // ssh
      {
        branch: 'main',
        path: '/var/www/app',
        processNames: ['serve'],
        sides: ['api'],
      },
      {} // lifecycle
    )

    expect(tasks[4].skip()).toEqual(true)
  })

  it('skips restart if --no-restart flag passed', () => {
    const tasks = baremetal.deployTasks(
      {
        update: true,
        install: true,
        migrate: true,
        build: true,
        restart: false,
        cleanup: true,
        releaseDir: '20220409120000',
      },
      {}, // ssh
      {
        branch: 'main',
        path: '/var/www/app',
        processNames: ['serve'],
        sides: ['api'],
      },
      {} // lifecycle
    )

    expect(tasks[6].skip()).toEqual(true)
  })

  it('skips cleanup if --no-cleanup flag passed', () => {
    const tasks = baremetal.deployTasks(
      {
        update: true,
        install: true,
        migrate: true,
        build: true,
        restart: true,
        cleanup: false,
        releaseDir: '20220409120000',
      },
      {}, // ssh
      {
        branch: 'main',
        path: '/var/www/app',
        processNames: ['serve'],
        sides: ['api'],
      },
      {} // lifecycle
    )

    expect(tasks[7].skip()).toEqual(true)
  })

  it('injects a before update event', () => {
    const tasks = baremetal.deployTasks(
      {
        update: true,
        install: true,
        migrate: true,
        build: true,
        restart: true,
        cleanup: true,
        releaseDir: '20220409120000',
      },
      {}, // ssh
      {
        branch: 'main',
        path: '/var/www/app',
        processNames: ['serve'],
        sides: ['api'],
      },
      { before: { update: ['touch before-update.txt'] } }
    )

    expect(Object.keys(tasks).length).toEqual(9)
    expect(tasks[0].title).toMatch('Before update: `touch before-update.txt`')
    expect(tasks[1].title).toMatch('Cloning')
    expect(tasks[2].title).toMatch('Symlink .env')
  })

  it('injects an after update event', () => {
    const tasks = baremetal.deployTasks(
      {
        update: true,
        install: true,
        migrate: true,
        build: true,
        restart: true,
        cleanup: true,
        releaseDir: '20220409120000',
      },
      {}, // ssh
      {
        branch: 'main',
        path: '/var/www/app',
        processNames: ['serve'],
        sides: ['api'],
      },
      { after: { update: ['touch after-update.txt'] } }
    )

    expect(Object.keys(tasks).length).toEqual(9)
    expect(tasks[0].title).toMatch('Cloning')
    expect(tasks[1].title).toMatch('After update: `touch after-update.txt`')
    expect(tasks[2].title).toMatch('Symlink .env')
  })
})
