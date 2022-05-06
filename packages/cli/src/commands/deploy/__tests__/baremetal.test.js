import * as baremetal from '../baremetal'

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
        [[servers]]
        host = 'server.com'

        [before]
        install = 'yarn clean'
      `
    )

    expect(envLifecycle.before).toEqual({ install: ['yarn clean'] })
    expect(envLifecycle.after).toEqual({})
  })

  it('parses multiple global lifecycle events', () => {
    const { _envConfig, envLifecycle } = baremetal.parseConfig(
      { environment: 'production' },
      `
        [[servers]]
        host = 'server.com'

        [before]
        install = 'yarn clean'
        update = 'ls -la'
      `
    )

    expect(envLifecycle.before).toEqual({
      install: ['yarn clean'],
      update: ['ls -la'],
    })
    expect(envLifecycle.after).toEqual({})
  })

  it('parses an array of global lifecycle events', () => {
    const { _envConfig, envLifecycle } = baremetal.parseConfig(
      { environment: 'production' },
      `
        [[servers]]
        host = 'server.com'

        [before]
        install = ['yarn clean', 'rm -rf *']
      `
    )

    expect(envLifecycle.before).toEqual({
      install: ['yarn clean', 'rm -rf *'],
    })
    expect(envLifecycle.after).toEqual({})
  })

  it.only('parses a environment lifecycle event', () => {
    const { _envConfig, envLifecycle } = baremetal.parseConfig(
      { environment: 'production' },
      `
        [[servers.production]]
        host = 'server.com'

        [production.before]
        install = 'yarn clean'
      `
    )

    expect(envLifecycle.before).toEqual({ install: ['yarn clean'] })
    expect(envLifecycle.after).toEqual({})
  })
})
