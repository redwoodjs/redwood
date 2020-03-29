import mockfs from 'mock-fs'

import { getConfig, DEFAULT_CONFIG } from './config'

describe('config', () => {
  it('has defaults', () => {
    // Call `console.log` before mocking the file-system:
    // https://github.com/tschaub/mock-fs/issues/234
    // console.log('')
    mockfs({
      'redwood.toml': '',
    })

    expect(getConfig()).toEqual(DEFAULT_CONFIG)
  })

  it('default config merges with `redwood.toml`', () => {
    // Call `console.log` before mocking the file-system:
    // https://github.com/tschaub/mock-fs/issues/234
    // console.log('')
    const toml = `
      [web]
        port = 8080
      [api]
        port = 8081
    `
    mockfs({
      'redwood.toml': toml,
    })

    const config = getConfig()
    expect(config.web.port).toEqual(8080)
    expect(config.api.port).toEqual(8081)
  })

  afterAll(() => {
    mockfs.restore()
  })
})
