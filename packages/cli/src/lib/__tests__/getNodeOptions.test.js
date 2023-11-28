import { getNodeOptions, enableSourceMapsOption } from '../getNodeOptions'

describe('getNodeOptions', () => {
  it('defaults to enable-source-maps', () => {
    const nodeOptions = getNodeOptions()
    expect(nodeOptions).toEqual(`NODE_OPTIONS=${enableSourceMapsOption}`)
  })

  it("doesn't specify `--enable-source-maps` twice", () => {
    process.env.NODE_OPTIONS = `NODE_OPTIONS=${enableSourceMapsOption}`

    const nodeOptions = getNodeOptions()
    expect(nodeOptions).toEqual(`NODE_OPTIONS=${enableSourceMapsOption}`)
  })

  it('merges existing options with `--enable-source-maps`', () => {
    const existingOptions = '--inspect --no-experimental-fetch'
    process.env.NODE_OPTIONS = `NODE_OPTIONS=${existingOptions}`

    const nodeOptions = getNodeOptions()
    expect(nodeOptions).toEqual(
      `NODE_OPTIONS=${existingOptions} ${enableSourceMapsOption}`
    )
  })
})
