import * as baremetal from '../baremetal'

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
