import type yargs from 'yargs'

import * as storybookCommand from '../commands/storybook'

jest.mock(
  '../commands/storybookHandler.js',
  () => ({
    handler: jest.fn(),
  }),
  { virtual: true },
)

describe('storybook', () => {
  it('exports command, aliases, description, defaultOptions, builder, and handler', () => {
    for (const property of [
      'command',
      'aliases',
      'description',
      'defaultOptions',
      'builder',
      'handler',
    ]) {
      expect(storybookCommand).toHaveProperty(property)
    }
  })

  it("`command`, `aliases`, and `description` haven't unintentionally changed", () => {
    expect(storybookCommand.command).toMatchInlineSnapshot(`"storybook-vite"`)
    expect(storybookCommand.aliases).toMatchInlineSnapshot(`
      Array [
        "sbv",
      ]
    `)
    expect(storybookCommand.description).toMatchInlineSnapshot(`
      "Launch Storybook: a tool for building UI components and pages in isolation (now, with Vite)!"
    `)
  })

  it("`defaultOptions` haven't unintentionally changed", () => {
    expect(storybookCommand.defaultOptions).toMatchInlineSnapshot(`
      Object {
        "open": true,
        "build": false,
        "ci": false,
        "port": 7910,
        "buildDirectory": 'public/storybook',
        "smokeTest": false,
      }
    `)
  })

  it('`builder` has an epilogue', () => {
    // The typecasting here is to make TS happy when calling `builder(yargs)`
    // further down. We know that only `epilogue` will be called.
    const yargs = { epilogue: jest.fn() } as yargs.Argv

    storybookCommand.builder(yargs)

    // The epilogue is a string that contains a link to the docs. The string
    // contains special control characters when rendered in a terminal that
    // supports clickable links. We use regular expressions and wildcards here
    // to avoid having to match control characters that might not even always
    // be there
    expect(yargs.epilogue).toHaveBeenCalledWith(
      expect.stringMatching(/Also see the .*Redwood CLI Reference.*/),
    )
    expect(yargs.epilogue).toHaveBeenCalledWith(
      expect.stringMatching(
        /https:\/\/redwoodjs\.com\/docs\/cli-commands#datamigrate-install/,
      ),
    )
  })
})
