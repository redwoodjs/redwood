import * as installCommand from '../commands/install'
import { handler as dataMigrateInstallHandler } from '../commands/installHandler.js'

jest.mock(
  '../commands/installHandler.js',
  () => ({
    handler: jest.fn(),
  }),
  { virtual: true }
)

describe('install', () => {
  it('exports `command`, `description`, `builder`, and `handler`', () => {
    for (const property of ['command', 'builder', 'description', 'handler']) {
      expect(installCommand).toHaveProperty(property)
    }
  })

  it("`command` and `description` haven't unintentionally changed", () => {
    expect(installCommand.command).toMatchInlineSnapshot(`"install"`)
    expect(installCommand.description).toMatchInlineSnapshot(
      `"Add the RW_DataMigration model to your schema"`
    )
  })

  it('`builder` has an epilogue', () => {
    const yargs = { epilogue: jest.fn() }
    // @ts-expect-error this is a test file; epilogue is the only thing `builder` calls right now
    installCommand.builder(yargs)
    expect(yargs.epilogue).toBeCalledWith(
      // eslint-disable-next-line no-irregular-whitespace
      'Also see the Redwood CLI Reference (​https://redwoodjs.com/docs/cli-commands#datamigrate-install​)'
    )
  })

  it('`handler` proxies to `./installHandler.js`', async () => {
    await installCommand.handler()
    expect(dataMigrateInstallHandler).toHaveBeenCalled()
  })
})
