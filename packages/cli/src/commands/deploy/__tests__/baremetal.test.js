import { Listr } from 'listr2'

jest.mock('@redwoodjs/internal/dist/paths', () => {
  return {
    getPaths: () => ({
      base: `${__dirname}/fixtures`,
    }),
  }
})

import * as baremetal from '../baremetal'

describe('verifyConfig', () => {
  it('throws an error if no environment specified', () => {
    expect(() =>
      baremetal.verifyConfig(
        { production: { servers: [{ host: 'prod.server.com' }] } },
        {}
      )
    ).toThrow('Must specify an environment to deploy to')
  })

  it('throws an error if environment is not found', () => {
    expect(() =>
      baremetal.verifyConfig(
        { production: { servers: [{ host: 'prod.server.com' }] } },
        { environment: 'staging' }
      )
    ).toThrow('No servers found for environment "staging"')
  })
})

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
      port: 12345,
      branch: 'venus',
      packageManagerCommand: 'npm',
      monitorCommand: 'god',
      sides: ['native', 'cli'],
      keepReleases: 2,
    }
    const config = baremetal.serverConfigWithDefaults(serverConfig, {})
    expect(config).toEqual(serverConfig)
  })

  it('provides default port as 22', () => {
    const config = baremetal.serverConfigWithDefaults({}, {})
    expect(config.port).toEqual(22)
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
  it('returns the config for an environment', () => {
    const { envConfig } = baremetal.parseConfig(
      { environment: 'production' },
      `
        [[production.servers]]
        host = 'server.com'
      `
    )

    expect(envConfig).toEqual({ servers: [{ host: 'server.com' }] })
  })

  it('returns the proper config from multiple environments', () => {
    const { envConfig } = baremetal.parseConfig(
      { environment: 'staging' },
      `
        [[production.servers]]
        host = 'prod.server.com'

        [[staging.servers]]
        host = 'staging.server.com'
      `
    )

    expect(envConfig).toEqual({ servers: [{ host: 'staging.server.com' }] })
  })

  it('returns empty objects if no lifecycle defined', () => {
    const { _envConfig, envLifecycle } = baremetal.parseConfig(
      { environment: 'production' },
      `
        [[production.servers]]
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

        [[production.servers]]
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

        [[production.servers]]
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

        [[production.servers]]
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

describe('commandWithLifecycleEvents', () => {
  it('returns just the command if no lifecycle defined', () => {
    const tasks = baremetal.commandWithLifecycleEvents({
      name: 'update',
      config: { serverLifecycle: {} },
      skip: false,
      command: {
        title: 'Some command',
        task: () => {},
      },
    })

    expect(tasks.length).toEqual(1)
    expect(tasks[0].title).toEqual('Some command')
    expect(tasks[0].skip()).toEqual(false)
  })

  it('copies `skip` output into task function', () => {
    const tasks = baremetal.commandWithLifecycleEvents({
      name: 'update',
      config: { serverLifecycle: {} },
      skip: 'foobar',
      command: {
        title: 'Some command',
        task: () => {},
      },
    })

    expect(tasks[0].skip()).toEqual('foobar')
  })

  it('includes a `before` lifecycle event', () => {
    const tasks = baremetal.commandWithLifecycleEvents({
      name: 'update',
      config: {
        serverLifecycle: { before: { update: ['touch'] } },
      },
      skip: false,
      command: {
        title: 'Some command',
        task: () => {},
      },
    })

    expect(tasks.length).toEqual(2)
    expect(tasks[0].title).toEqual('Before update: `touch`')
    expect(tasks[0].skip()).toEqual(false)
    expect(tasks[1].title).toEqual('Some command')
    expect(tasks[1].skip()).toEqual(false)
  })

  it('includes multiple `before` lifecycle events', () => {
    const tasks = baremetal.commandWithLifecycleEvents({
      name: 'update',
      config: {
        serverLifecycle: { before: { update: ['touch1', 'touch2'] } },
      },
      skip: false,
      command: {
        title: 'Some command',
        task: () => {},
      },
    })

    expect(tasks.length).toEqual(3)
    expect(tasks[0].title).toEqual('Before update: `touch1`')
    expect(tasks[0].skip()).toEqual(false)
    expect(tasks[1].title).toEqual('Before update: `touch2`')
    expect(tasks[1].skip()).toEqual(false)
    expect(tasks[2].title).toEqual('Some command')
    expect(tasks[2].skip()).toEqual(false)
  })

  it('copies `skip` output into `before` lifecycle event task function', () => {
    const tasks = baremetal.commandWithLifecycleEvents({
      name: 'update',
      config: {
        serverLifecycle: { before: { update: ['touch'] } },
      },
      skip: 'foobar',
      command: {
        title: 'Some command',
        task: () => {},
      },
    })

    expect(tasks[0].skip()).toEqual('foobar')
    expect(tasks[1].skip()).toEqual('foobar')
  })

  it('includes an `after` lifecycle event', () => {
    const tasks = baremetal.commandWithLifecycleEvents({
      name: 'update',
      config: {
        serverLifecycle: { after: { update: ['touch'] } },
      },
      skip: false,
      command: {
        title: 'Some command',
        task: () => {},
      },
    })

    expect(tasks.length).toEqual(2)
    expect(tasks[0].title).toEqual('Some command')
    expect(tasks[0].skip()).toEqual(false)
    expect(tasks[1].title).toEqual('After update: `touch`')
    expect(tasks[1].skip()).toEqual(false)
  })

  it('includes multiple `after` lifecycle events', () => {
    const tasks = baremetal.commandWithLifecycleEvents({
      name: 'update',
      config: {
        serverLifecycle: { after: { update: ['touch1', 'touch2'] } },
      },
      skip: false,
      command: {
        title: 'Some command',
        task: () => {},
      },
    })

    expect(tasks.length).toEqual(3)
    expect(tasks[0].title).toEqual('Some command')
    expect(tasks[0].skip()).toEqual(false)
    expect(tasks[1].title).toEqual('After update: `touch1`')
    expect(tasks[1].skip()).toEqual(false)
    expect(tasks[2].title).toEqual('After update: `touch2`')
    expect(tasks[2].skip()).toEqual(false)
  })

  it('copies `skip` output into `after` lifecycle event task function', () => {
    const tasks = baremetal.commandWithLifecycleEvents({
      name: 'update',
      config: {
        serverLifecycle: { after: { update: ['touch'] } },
      },
      skip: 'foobar',
      command: {
        title: 'Some command',
        task: () => {},
      },
    })

    expect(tasks[0].skip()).toEqual('foobar')
    expect(tasks[1].skip()).toEqual('foobar')
  })

  it('includes both `before` and `after` lifecycle events', () => {
    const tasks = baremetal.commandWithLifecycleEvents({
      name: 'update',
      config: {
        serverLifecycle: {
          before: { update: ['touch1'] },
          after: { update: ['touch2'] },
        },
      },
      skip: false,
      command: {
        title: 'Some command',
        task: () => {},
      },
    })

    expect(tasks.length).toEqual(3)
    expect(tasks[0].title).toEqual('Before update: `touch1`')
    expect(tasks[0].skip()).toEqual(false)
    expect(tasks[1].title).toEqual('Some command')
    expect(tasks[1].skip()).toEqual(false)
    expect(tasks[2].title).toEqual('After update: `touch2`')
    expect(tasks[2].skip()).toEqual(false)
  })
})

describe('deployTasks', () => {
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

  it('injects lifecycle events for update', () => {
    const tasks = baremetal.deployTasks(
      defaultYargs,
      {}, // ssh
      defaultServerConfig,
      { before: { update: ['touch before-update.txt'] } }
    )

    expect(Object.keys(tasks).length).toEqual(9)
    expect(tasks[0].title).toMatch('Before update: `touch before-update.txt`')
    expect(tasks[1].title).toMatch('Cloning')
  })

  it('injects lifecycle events for install', () => {
    const tasks = baremetal.deployTasks(
      defaultYargs,
      {}, // ssh
      defaultServerConfig,
      { before: { install: ['touch before-install.txt'] } }
    )

    expect(Object.keys(tasks).length).toEqual(9)
    expect(tasks[2].title).toMatch('Before install: `touch before-install.txt`')
    expect(tasks[3].title).toMatch('Install')
  })

  it('injects lifecycle events for migrate', () => {
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

  it('injects lifecycle events for build', () => {
    const tasks = baremetal.deployTasks(
      defaultYargs,
      {}, // ssh
      defaultServerConfig,
      { before: { build: ['touch before-build.txt'] } }
    )

    expect(Object.keys(tasks).length).toEqual(9)
    expect(tasks[4].title).toMatch('Before build: `touch before-build.txt`')
    expect(tasks[5].title).toMatch('Building api')
  })

  it('injects lifecycle events for restart', () => {
    const tasks = baremetal.deployTasks(
      defaultYargs,
      {}, // ssh
      defaultServerConfig,
      { before: { restart: ['touch before-restart.txt'] } }
    )

    expect(Object.keys(tasks).length).toEqual(9)
    expect(tasks[6].title).toMatch('Before restart: `touch before-restart.txt`')
    expect(tasks[7].title).toMatch('Restarting')
  })

  it('injects lifecycle events for cleanup', () => {
    const tasks = baremetal.deployTasks(
      defaultYargs,
      {}, // ssh
      defaultServerConfig,
      { before: { cleanup: ['touch before-cleanup.txt'] } }
    )

    expect(Object.keys(tasks).length).toEqual(9)
    expect(tasks[7].title).toMatch('Before cleanup: `touch before-cleanup.txt`')
    expect(tasks[8].title).toMatch('Cleaning up')
  })
})

describe('commands', () => {
  it('contains a top-level task for each server in an environment', () => {
    const prodServers = baremetal.commands(
      { environment: 'production', releaseDir: '2022051120000' },
      {}
    )
    const stagingServers = baremetal.commands(
      { environment: 'staging', releaseDir: '2022051120000' },
      {}
    )

    expect(prodServers.length).toEqual(2)
    expect(prodServers[0].title).toEqual('prod1.server.com')
    expect(prodServers[1].title).toEqual('prod2.server.com')

    expect(stagingServers.length).toEqual(1)
    expect(stagingServers[0].title).toEqual('staging.server.com')
  })

  it('a single server contains nested deploy tasks', () => {
    const servers = baremetal.commands(
      { environment: 'staging', releaseDir: '2022051120000' },
      {}
    )

    expect(servers[0].task()).toBeInstanceOf(Listr)
  })

  it('contains connection and disconnection tasks', () => {
    const servers = baremetal.commands(
      { environment: 'staging', releaseDir: '2022051120000' },
      {}
    )
    const tasks = servers[0].task().tasks

    expect(tasks[0].title).toMatch('Connecting')
    expect(tasks[9].title).toMatch('Disconnecting')
  })

  it('contains deploy tasks by default', () => {
    const servers = baremetal.commands(
      { environment: 'staging', releaseDir: '2022051120000' },
      {}
    )
    const tasks = servers[0].task().tasks

    expect(tasks[1].title).toMatch('Cloning')
  })

  it('contains maintenance tasks if yargs are set', () => {
    const servers = baremetal.commands(
      {
        environment: 'staging',
        releaseDir: '2022051120000',
        maintenance: 'up',
      },
      {}
    )
    const tasks = servers[0].task().tasks

    expect(tasks.length).toEqual(3)
    expect(tasks[1].title).toMatch('Enabling maintenance')
  })

  it('contains rollback tasks if yargs are set', () => {
    const servers = baremetal.commands(
      {
        environment: 'staging',
        releaseDir: '2022051120000',
        rollback: 2,
      },
      {}
    )
    const tasks = servers[0].task().tasks

    expect(tasks.length).toEqual(3)
    expect(tasks[1].title).toMatch('Rolling back 2 release(s)')
  })

  it('includes server-specific lifecycle events', () => {
    const servers = baremetal.commands(
      {
        environment: 'test',
        releaseDir: '2022051120000',
      },
      {}
    )
    const tasks = servers[0].task().tasks

    expect(tasks[1].title).toEqual('Before update: `touch update`')
    expect(tasks[5].title).toEqual('After install: `touch install`')
  })
})
