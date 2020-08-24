import { prisma_parseEnvExpressions } from '../prisma'
import { Range } from 'vscode-languageserver'

describe('prisma_parseEnvExpressions', () => {
  it('can find env() expressions in a prisma schema', async () => {
    const [r] = Array.from(prisma_parseEnvExpressions(`env("foo") `))
    const range = Range.create(0, 0, 0, 10)
    expect(r).toEqual({ range, key: 'foo' })
  })
})
