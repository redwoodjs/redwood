import type { ComponentProps, JSXElementConstructor } from 'react'

import type { DocumentNode } from 'graphql'
import type { A } from 'ts-toolbelt'

import { getOperationName } from '../graphql'

import { useCellCacheContext } from './CellCacheContext'
/**
 * This is part of how we let users swap out their GraphQL client while staying compatible with Cells.
 */
import { useQuery } from './GraphQLHooksProvider'

declare type CustomCellProps<Cell, GQLVariables> = Cell extends {
  beforeQuery: (...args: unknown[]) => unknown
}
  ? Parameters<Cell['beforeQuery']> extends [unknown, ...any]
    ? Parameters<Cell['beforeQuery']>[0]
    : Record<string, never>
  : GQLVariables extends {
      [key: string]: never
    }
  ? unknown
  : GQLVariables

/**
 * Cell component props which is the combination of query variables and Success props.
 */
export type CellProps<
  CellSuccess extends keyof JSX.IntrinsicElements | JSXElementConstructor<any>,
  GQLResult,
  CellType,
  GQLVariables
> = A.Compute<
  Omit<
    ComponentProps<CellSuccess>,
    keyof QueryOperationResult | keyof GQLResult | 'updating'
  > &
    CustomCellProps<CellType, GQLVariables>
>

export type CellLoadingProps<TVariables = any> = Partial<
  Omit<QueryOperationResult<any, TVariables>, 'loading' | 'error' | 'data'>
>

export type CellFailureProps<TVariables = any> = Partial<
  Omit<QueryOperationResult<any, TVariables>, 'loading' | 'error' | 'data'> & {
    error: QueryOperationResult['error'] | Error // for tests and storybook
    /**
     * @see {@link https://www.apollographql.com/docs/apollo-server/data/errors/#error-codes}
     */
    errorCode: string
    updating: boolean
  }
>

// aka guarantee that all properties in T exist
// This is necessary for Cells, because if it doesn't exist it'll go to Empty or Failure
type Guaranteed<T> = {
  [K in keyof T]-?: NonNullable<T[K]>
}

/**
 * Use this type, if you are forwarding on the data from your Cell's Success component
 * Because Cells automatically checks for "empty", or "errors" - if you receive the data type in your
 * Success component, it means the data is guaranteed (and non-optional)
 *
 * @params TData = Type of data based on your graphql query. This can be imported from 'types/graphql'
 * @example
 * import type {FindPosts} from 'types/graphql'
 *
 * const { post } = CellSuccessData<FindPosts>
 *
 * post.id // post is non optional, so no need to do post?.id
 *
 */
export type CellSuccessData<TData = any> = Omit<Guaranteed<TData>, '__typename'>

/**
 * @MARK not sure about this partial, but we need to do this for tests and storybook.
 *
 * `updating` is just `loading` renamed; since Cells default to stale-while-refetch,
 * this prop lets users render something like a spinner to show that a request is in-flight.
 */
export type CellSuccessProps<TData = any, TVariables = any> = Partial<
  Omit<
    QueryOperationResult<TData, TVariables>,
    'loading' | 'error' | 'data'
  > & {
    updating: boolean
  }
> &
  A.Compute<CellSuccessData<TData>> // pre-computing makes the types more readable on hover

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
export interface CreateCellProps<CellProps, CellVariables> {
  /**
   * The GraphQL syntax tree to execute or function to call that returns it.
   * If `QUERY` is a function, it's called with the result of `beforeQuery`.
   */
  QUERY: DocumentNode | ((variables: Record<string, unknown>) => DocumentNode)
  /**
   * Parse `props` into query variables. Most of the time `props` are appropriate variables as is.
   */
  beforeQuery?:
    | ((props: CellProps) => { variables: CellVariables })
    | (() => { variables: CellVariables })
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
export function createCell<
  CellProps extends Record<string, unknown>,
  CellVariables extends Record<string, unknown>
>({
  QUERY,
  beforeQuery = (props) => ({
    variables: props as CellVariables,
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
}: CreateCellProps<CellProps, CellVariables>): React.FC<CellProps> {
  function NamedCell(props: React.PropsWithChildren<CellProps>) {
    /**
     * Right now, Cells don't render `children`.
     */
    const { children: _, ...variables } = props
    const options = beforeQuery(variables as CellProps)
    const query = typeof QUERY === 'function' ? QUERY(options) : QUERY

    // queryRest includes `variables: { ... }`, with any variables returned
    // from beforeQuery
    // eslint-disable-next-line prefer-const
    let { error, loading, data, ...queryRest } = useQuery(query, options)

    if (global.__REDWOOD__PRERENDERING) {
      // __REDWOOD__PRERENDERING will always either be set, or not set. So
      // rules-of-hooks are still respected, even though we wrap this in an if
      // statement
      /* eslint-disable-next-line react-hooks/rules-of-hooks */
      const { queryCache } = useCellCacheContext()
      const operationName = getOperationName(query)

      let cacheKey

      if (operationName) {
        cacheKey = operationName + '_' + JSON.stringify(variables)
      } else {
        const cellName = displayName === 'Cell' ? 'the cell' : displayName

        throw new Error(
          `The gql query in ${cellName} is missing an operation name. ` +
            'Something like FindBlogPostQuery in ' +
            '`query FindBlogPostQuery($id: Int!)`'
        )
      }

      const queryInfo = queryCache[cacheKey]

      // This is true when the graphql handler couldn't be loaded
      // So we fallback to the loading state
      if (queryInfo?.renderLoading) {
        loading = true
      } else {
        if (queryInfo?.hasProcessed) {
          loading = false
          data = queryInfo.data

          // All of the gql client's props aren't available when pre-rendering,
          // so using `any` here
          queryRest = { variables } as any
        } else {
          queryCache[cacheKey] ||
            (queryCache[cacheKey] = {
              query,
              variables: options.variables,
              hasProcessed: false,
            })
        }
      }
    }

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
