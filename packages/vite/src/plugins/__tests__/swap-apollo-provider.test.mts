import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import plugin from '../vite-plugin-swap-apollo-provider.js'

// @ts-expect-error node test not configured correctly
const swapApolloProvider = plugin.default


describe('excludeModule', () => {
  it('should swap the import', async() => {
    const plugin = swapApolloProvider()

   const output = await plugin.transform(`import ApolloProvider from '@redwoodjs/web/apollo'`, '/Users/dac09/Experiments/ssr-2354/web/src/App.tsx')

   assert.strictEqual(output, "import ApolloProvider from '@redwoodjs/web/dist/apollo/suspense'")
})
})
