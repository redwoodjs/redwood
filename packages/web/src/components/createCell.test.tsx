/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'

import { createCell } from './createCell'
import { GraphQLHooksProvider } from './GraphQLHooksProvider'

describe('QueryHooksProvider', () => {
  test('Renders a static cell', async () => {
    const TestCell = createCell({
      // @ts-expect-error - Purposefully using a plain string here.
      QUERY: 'query TestQuery { answer }',
      Success: () => <>Great success!</>,
    })

    const myUseQueryHook = () => {
      return { loading: false, data: { answer: 42 } }
    }

    render(
      <GraphQLHooksProvider useQuery={myUseQueryHook} useMutation={null}>
        <TestCell />
      </GraphQLHooksProvider>
    )
    await waitFor(() => screen.getByText('Great success!'))
  })
})
