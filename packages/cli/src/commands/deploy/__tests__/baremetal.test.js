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

    expect(envLifecycle).toEqual({ before: {}, after: {} })
  })

  it('finds a single global lifecycle event', () => {
    const { _envConfig, envLifecycle } = baremetal.parseConfig(
      { environment: 'production' },
      `
  [[servers]]
  host = 'server.com'

  [before]
  install = 'yarn clean'
  `
    )

    expect(envLifecycle).toEqual({
      before: { install: ['yarn clean'] },
      after: {},
    })
  })
})
