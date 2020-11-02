import { useState } from 'react'
import { DocumentNode, GraphQLError, print } from 'graphql'
import { TypedDocumentNode } from '@graphql-typed-document-node/core'
import { BaseQueryOptions, GqlError, OperationVariables, QueryResult } from '.'
import { useGraphQLState } from './GraphQLContext'

export function useQuery<TData = any, TVariables = OperationVariables>(
  query: DocumentNode | TypedDocumentNode<TData, TVariables>,
  options?: BaseQueryOptions<TVariables>
): QueryResult<TData> {
  const { headers } = useGraphQLState()
  const [data, setData] = useState<TData | undefined>(undefined)
  const [error, setError] = useState<GqlError>()
  const [loading, setLoading] = useState(true)

  React.useEffect(() => {
    const fetchData = async () => {
      function handleError(error: GraphQLError[] | string | undefined) {
        let gqlError: GqlError

        if (typeof error === 'string') {
          gqlError = {
            message: error,
            graphQLErrors: [],
            name: '',
          }
        } else if (typeof error === 'undefined') {
          gqlError = {
            message: 'Unknown GQL error',
            graphQLErrors: [],
            name: '',
          }
        } else {
          gqlError = {
            message: '',
            graphQLErrors: error,
            name: '',
          }
        }

        setError(gqlError)
      }

      try {
        const res = await fetch(`${window.__REDWOOD__API_PROXY_PATH}/graphql`, {
          method: 'post',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: print(query),
            variables: options?.variables,
          }),
        })

        const json = await res.json()

        if (json.errors && json.errors.length > 0) {
          throw json.errors
        } else {
          setData(json.data)
          setLoading(false)
        }
      } catch (error) {
        handleError(error)
        setLoading(false)
      }
    }
    fetchData()
  }, [query])

  return { data, error, loading }
}
