import type { ComponentProps, JSXElementConstructor } from 'react'

import type { DocumentNode } from 'graphql'
import type { A } from 'ts-toolbelt'

/**
 * This is part of how we let users swap out their GraphQL client while staying compatible with Cells.
 */
import { useQuery } from './GraphQLHooksProvider'

/**
 * Cell component props which is the combination of query variables and Success props.
 */
export type CellProps<
  CellSuccess extends keyof JSX.IntrinsicElements | JSXElementConstructor<any>,
  GQLResult,
  GQLVariables
> = A.Compute<
  Omit<
    ComponentProps<CellSuccess>,
    keyof QueryOperationResult | keyof GQLResult | 'updating'
  > &
    (GQLVariables extends { [key: string]: never } ? unknown : GQLVariables)
>

export type CellLoadingProps = Partial<
  Omit<QueryOperationResult, 'loading' | 'error' | 'data'>
>

export type CellFailureProps = Partial<
  Omit<QueryOperationResult, 'loading' | 'error' | 'data'> & {
    error: QueryOperationResult['error'] | Error // for tests and storybook
    /**
     * @see {@link https://www.apollographql.com/docs/apollo-server/data/errors/#error-codes}
     */
    errorCode: string
    updating: boolean
  }
>

/**
 * @MARK not sure about this partial, but we need to do this for tests and storybook.
 *
 * `updating` is just `loading` renamed; since Cells default to stale-while-refetch,
 * this prop lets users render something like a spinner to show that a request is in-flight.
 */
export type CellSuccessProps<TData = any> = Partial<
  Omit<QueryOperationResult<TData>, 'loading' | 'error' | 'data'> & {
    updating: boolean
  }
> &
  A.Compute<TData> // pre-computing makes the types more readable on hover

/**
 * A coarse type for the `data` prop returned by `useQuery`.
 *
 * ```js
 * {
 *   data: {
 *     post: { ... }
 *   }
 * }
 * ```
 */
export type DataObject = { [key: string]: unknown }

/**
 * The main interface.
 */
export interface CreateCellProps<CellProps> {
  /**
   * The GraphQL syntax tree to execute or function to call that returns it.
   * If `QUERY` is a function, it's called with the result of `beforeQuery`.
   */
  QUERY: DocumentNode | ((variables: Record<string, unknown>) => DocumentNode)
  /**
   * Parse `props` into query variables. Most of the time `props` are appropriate variables as is.
   */
  beforeQuery?: <TProps>(props: TProps) => { variables: TProps }
  /**
   * Sanitize the data returned from the query.
   */
  afterQuery?: (data: DataObject) => DataObject
  /**
   * How to decide if the result of a query should render the `Empty` component.
   * The default implementation checks that the first field isn't `null` or an empty array.
   *
   * @example
   *
   * In the example below, only `users` is checked:
   *
   * ```js
   * export const QUERY = gql`
   *   users {
   *     name
   *   }
   *   posts {
   *     title
   *   }
   * `
   * ```
   */
  isEmpty?: (
    response: DataObject,
    options: {
      isDataEmpty: (data: DataObject) => boolean
    }
  ) => boolean
  /**
   * If the query's in flight and there's no stale data, render this.
   */
  Loading?: React.FC<CellLoadingProps & Partial<CellProps>>
  /**
   * If something went wrong, render this.
   */
  Failure?: React.FC<CellFailureProps & Partial<CellProps>>
  /**
   * If no data was returned, render this.
   */
  Empty?: React.FC<CellSuccessProps & Partial<CellProps>>
  /**
   * If data was returned, render this.
   */
  Success: React.FC<CellSuccessProps & Partial<CellProps>>
  /**
   * What to call the Cell. Defaults to the filename.
   */
  displayName?: string
}

/**
 * The default `isEmpty` implementation. Checks if the first field is `null` or an empty array.
 *
 * @remarks
 *
 * Consider the following queries. The former returns an object, the latter a list:
 *
 * ```js
 * export const QUERY = gql`
 *   post {
 *     title
 *   }
 * `
 *
 * export const QUERY = gql`
 *   posts {
 *     title
 *   }
 * `
 * ```
 *
 * If either are "empty", they return:
 *
 * ```js
 * {
 *   data: {
 *     post: null
 *   }
 * }
 *
 * {
 *   data: {
 *     posts: []
 *   }
 * }
 * ```
 *
 * Note that the latter can return `null` as well depending on the SDL (`posts: [Post!]`).
 *
 * @remarks
 *
 * We only check the first field (in the example below, `users`):
 *
 * ```js
 * export const QUERY = gql`
 *   users {
 *     name
 *   }
 *   posts {
 *     title
 *   }
 * `
 * ```
 */
const dataField = (data: DataObject) => {
  return data[Object.keys(data)[0]]
}

const isDataNull = (data: DataObject) => {
  return dataField(data) === null
}

const isDataEmptyArray = (data: DataObject) => {
  const field = dataField(data)
  return Array.isArray(field) && field.length === 0
}

const isDataEmpty = (data: DataObject) => {
  return isDataNull(data) || isDataEmptyArray(data)
}

/**
 * Creates a Cell out of a GraphQL query and components that track to its lifecycle.
 */
export function createCell<CellProps = any>({
  QUERY,
  beforeQuery = (props) => ({
    variables: props,
    /**
     * We're duplicating these props here due to a suspected bug in Apollo Client v3.5.4
     * (it doesn't seem to be respecting `defaultOptions` in `RedwoodApolloProvider`.)
     *
     * @see {@link https://github.com/apollographql/apollo-client/issues/9105}
     */
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  }),
  afterQuery = (data) => ({ ...data }),
  isEmpty = isDataEmpty,
  Loading = () => <>Loading...</>,
  Failure,
  Empty,
  Success,
  displayName = 'Cell',
}: CreateCellProps<CellProps>): React.FC<CellProps> {
  /**
   * If we're prerendering, render the Cell's Loading component and exit early.
   */
  if (global.__REDWOOD__PRERENDERING) {
    /**
     * Apollo Client's props aren't available here, so 'any'.
     */
    return (props) => <Loading {...(props as any)} />
  }

  function NamedCell(props: React.PropsWithChildren<CellProps>) {
    /**
     * Right now, Cells don't render `children`.
     */
    const { children: _, ...variables } = props

    const options = beforeQuery(variables)

    // queryRest includes `variables: { ... }`, with any variables returned
    // from beforeQuery
    const { error, loading, data, ...queryRest } = useQuery(
      typeof QUERY === 'function' ? QUERY(options) : QUERY,
      options
    )

    if (error) {
      if (Failure) {
        return (
          <Failure
            error={error}
            errorCode={error.graphQLErrors?.[0]?.extensions?.['code'] as string}
            {...props}
            updating={loading}
            {...queryRest}
          />
        )
      } else {
        throw error
      }
    } else if (data) {
      const afterQueryData = afterQuery(data)

      if (isEmpty(data, { isDataEmpty }) && Empty) {
        return (
          <Empty
            {...props}
            {...afterQueryData}
            updating={loading}
            {...queryRest}
          />
        )
      } else {
        return (
          <Success
            {...props}
            {...afterQueryData}
            updating={loading}
            {...queryRest}
          />
        )
      }
    } else if (loading) {
      return <Loading {...{ ...queryRest, ...props }} />
    } else {
      /**
       * There really shouldn't be an `else` here, but like any piece of software, GraphQL clients have bugs.
       * If there's no `error` and there's no `data` and we're not `loading`, something's wrong. Most likely with the cache.
       *
       * @see {@link https://github.com/redwoodjs/redwood/issues/2473#issuecomment-971864604}
       */
      console.warn(
        `If you're using Apollo Client, check for its debug logs here in the console, which may help explain the error.`
      )
      throw new Error(
        'Cannot render Cell: reached an unexpected state where the query succeeded but `data` is `null`. If this happened in Storybook, your query could be missing fields; otherwise this is most likely a GraphQL caching bug. Note that adding an `id` field to all the fields on your query may fix the issue.'
      )
    }
  }

  NamedCell.displayName = displayName

  return NamedCell
}
