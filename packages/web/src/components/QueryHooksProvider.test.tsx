import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'

import { QueryHooksProvider, useQuery, useMutation } from './QueryHooksProvider'

const TestUseQueryHook: React.FunctionComponent = () => {
  // @ts-expect-error - Purposefully not passing in a DocumentNode type here.
  const result = useQuery('query TestQuery { answer }', {
    variables: {
      question: 'What is the answer to life, the universe and everything?',
    },
  })

  return <>{JSON.stringify(result)}</>
}

const TestUseMutationHook: React.FunctionComponent = () => {
  // @ts-expect-error - Purposefully not passing in a DocumentNode type here.
  const result = useMutation('mutation UpdateThing(input: "x") { answer }', {
    variables: {
      question: 'What is the answer to life, the universe and everything?',
    },
  })

  return <>{JSON.stringify(result)}</>
}

describe('QueryHooksProvider', () => {
  test('useQueryHook is called with the correct query and arguments', (done) => {
    const myUseQueryHook = (query, options) => {
      expect(query).toEqual('query TestQuery { answer }')
      expect(options.variables.question).toEqual(
        'What is the answer to life, the universe and everything?'
      )
      done()
      return { loading: false, data: { answer: 42 } }
    }
    render(
      <QueryHooksProvider
        registerUseQueryHook={myUseQueryHook}
        registerUseMutationHook={null}
      >
        <TestUseQueryHook />
      </QueryHooksProvider>
    )
  })

  test('useMutationHook is called with the correct query and arguments', (done) => {
    const myUseMutationHook = (query, options) => {
      expect(query).toEqual('mutation UpdateThing(input: "x") { answer }')
      expect(options.variables.question).toEqual(
        'What is the answer to life, the universe and everything?'
      )
      done()
      return { loading: false, data: { answer: 42 } }
    }
    render(
      <QueryHooksProvider
        registerUseQueryHook={null}
        registerUseMutationHook={myUseMutationHook}
      >
        <TestUseMutationHook />
      </QueryHooksProvider>
    )
  })

  test('useQueryHook returns the correct result', async () => {
    const myUseQueryHook = (query, options) => {
      return { loading: false, data: { answer: 42 } }
    }
    render(
      <QueryHooksProvider
        registerUseQueryHook={myUseQueryHook}
        registerUseMutationHook={null}
      >
        <TestUseQueryHook />
      </QueryHooksProvider>
    )
    await waitFor(() =>
      screen.getByText('{"loading":false,"data":{"answer":42}}')
    )
  })

  test('useMutationHook returns the correct result', async () => {
    const myUseMutationHook = (query, options) => {
      return { loading: false, data: { answer: 42 } }
    }
    render(
      <QueryHooksProvider
        registerUseQueryHook={null}
        registerUseMutationHook={myUseMutationHook}
      >
        <TestUseMutationHook />
      </QueryHooksProvider>
    )
    await waitFor(() =>
      screen.getByText('{"loading":false,"data":{"answer":42}}')
    )
  })
})
