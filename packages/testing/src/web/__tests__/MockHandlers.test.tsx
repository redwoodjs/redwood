import 'whatwg-fetch'
import React, { useCallback, useState } from 'react'

import { render, screen, fireEvent, waitFor } from '@testing-library/react'

import { mockGraphQLQuery } from '../mockRequests'

jest.setTimeout(6_000)

describe('GraphQLMockHandlers', () => {
  it('should allow you to compose mock graphql handlers for more complex tests', async () => {
    const baseResult = {
      article: {
        id: 1,
        title: 'Foobar',
        body: 'Lorem ipsum...',
      },
    }
    const onceResult = {
      article: {
        id: 2,
        title: 'Foobar1',
        body: 'Lorem ipsum123...',
      },
    }

    // Create the base response that always returns
    mockGraphQLQuery('GetArticle', () => baseResult)
    // Create a one time handler
    mockGraphQLQuery('GetArticle', () => onceResult, 'once')

    const FakeComponent = () => {
      const [result, setResult] = useState()
      const [error, setError] = useState()
      const [fetching, setFetching] = useState(false)

      const doFetch = useCallback(() => {
        setFetching(true)
        fetch('https://example.com/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: `
                query GetArticle($id: ID!) {
                  article(id: $id) {
                    id
                    title
                    body
                  }
                }
              `,
            variables: {
              id: 3,
            },
          }),
        })
          .then(async (result) => {
            const data = await result.json()
            setResult(data)
          })
          .catch((err) => {
            console.error('err', err)
            setError(err)
          })
          .finally(() => setFetching(false))
      }, [])

      return (
        <div>
          <button data-testid="fetch" onClick={doFetch}>
            Fetch
          </button>
          <div data-testid="result">{JSON.stringify(result)}</div>
          <div data-testid="status">{String(fetching)}</div>
          {error && <div data-testid="error">{JSON.stringify(error)}</div>}
        </div>
      )
    }

    const { rerender } = render(<FakeComponent />)

    const button = screen.getByTestId('fetch')
    const result = screen.getByTestId('result')
    const status = screen.getByTestId('status')

    fireEvent.click(button)

    await waitFor(
      () =>
        expect(JSON.parse(result?.textContent ?? '')).toEqual({
          data: onceResult,
        }),
      {
        timeout: 2_000,
      }
    )

    fireEvent.click(button)

    await waitFor(
      () =>
        expect(JSON.parse(result.textContent ?? '')).toEqual({
          data: baseResult,
        }),
      {
        timeout: 2_000,
      }
    )

    fireEvent.click(button)

    await waitFor(
      () => {
        expect(status).toHaveTextContent('false')
        expect(JSON.parse(result.textContent ?? '')).toEqual({
          data: baseResult,
        })
      },
      {
        timeout: 2_000,
      }
    )

    // Create a networkError
    mockGraphQLQuery(
      'GetArticle',
      () => {
        return {
          article: {
            id: 9001,
            title: 'Foobar1a',
            body: 'Lorem ipssfaum123...',
          },
        }
      },
      'networkError'
    )

    rerender(<FakeComponent />)

    fireEvent.click(button)

    const error = await screen.findByTestId('error')

    await waitFor(
      () =>
        expect(JSON.parse(error?.textContent ?? '')).toEqual({
          cause: {
            name: 'NetworkError',
          },
        }),
      {
        timeout: 2_000,
      }
    )
  })
})
