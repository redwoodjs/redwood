import type { DocumentNode } from 'graphql'

import { useQuery, OperationResult } from './GraphQLHooksProvider'

interface QueryProps {
  query: DocumentNode
  children: (result: OperationResult) => React.ReactElement
}

const Query: React.FC<QueryProps> = ({ children, query, ...rest }) => {
  const result = useQuery(query, rest)
  return result ? children(result) : null
}

export type DataObject = { [key: string]: unknown }

export type CellFailureStateComponent = Omit<
  OperationResult,
  'data' | 'loading'
>
export type CellLoadingEmptyStateComponent = Omit<
  OperationResult,
  'error' | 'loading' | 'data'
>
export type CellSuccessStateComponent<TData = any> =
  | Omit<OperationResult<TData>, 'error' | 'loading' | 'data'>
  | DataObject

export interface WithCellProps<
  TData,
  TVariables extends Record<string, unknown>,
  TInitialData = TData,
  TProps extends { variables: TVariables } & Record<string, unknown> = {
    variables: TVariables
  },
  TProcessedProps = TProps
> {
  beforeQuery?: (props: TProps) => TProcessedProps
  QUERY: DocumentNode | ((variables: TProcessedProps) => DocumentNode)
  afterQuery?: (data: TInitialData) => TData
  Loading?: React.FC<CellLoadingEmptyStateComponent & TProps>
  Failure?: React.FC<CellFailureStateComponent>
  Empty?: React.FC<CellLoadingEmptyStateComponent>
  Success: React.FC<CellSuccessStateComponent<TData>>
}

/**
 * Is a higher-order-component that executes a GraphQL query and automatically
 * manages the lifecycle of that query. If you export named parameters that match
 * the required params of `withCell` it will be automatically wrapped in this
 * HOC via a babel-plugin.
 *
 * @param {string} QUERY - The graphQL syntax tree to execute
 * @param {function=} beforeQuery - Prepare the variables and options for the query
 * @param {function=} afterQuery - Sanitize the data return from graphQL
 * @param {Component=} Loading - Loading, render this component
 * @param {Component=} Empty - Loading, render this component
 * @param {Component=} Failure - Something went wrong, render this component
 * @param {Component} Success - Data has loaded, render this component
 *
 * @example
 * ```js
 * // IMPLEMENTATION:
 * // `src/ExampleComponent/index.js`. This file is automatically dealt with
 * in webpack.
 *
 * import { withCell } from '@redwoodjs/web'
 * import * as cell from './ExampleComponent'
 *
 * export default withCell(cell)
 * ```
 *
 * // USAGE:
 * // Now you have a cell component that will handle the lifecycle methods of
 * // a query
 * import ExampleComponent from 'src/ExampleComponent'
 *
 * const ThingThatUsesExampleComponent = () => {
 *  return <div><ExampleComponent /></div>
 * }
 */

const isDataNull = (data: DataObject) => {
  return dataField(data) === null
}

const isDataEmptyArray = (data: DataObject) => {
  const field = dataField(data)
  return Array.isArray(field) && field.length === 0
}

const dataField = (data: DataObject) => {
  return data[Object.keys(data)[0]]
}

const isEmpty = (data: DataObject) => {
  return isDataNull(data) || isDataEmptyArray(data)
}

export function withCell<
  TData = any,
  TVariables extends Record<string, unknown> = any
>({
  beforeQuery = (props) => ({
    variables: props,
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  }),
  QUERY,
  afterQuery = (data: TData) => data,
  Loading = () => <>Loading...</>,
  Failure,
  Empty,
  Success,
}: WithCellProps<TData, TVariables>) {
  type TProps = Parameters<typeof beforeQuery>[0]

  // If its prerendering, render the Cell's Loading component
  if (global.__REDWOOD__PRERENDERING) {
    return (props: TProps) => <Loading {...props} />
  }

  return (props: TProps) => {
    if ('children' in props) {
      throw Error(
        'Cells should not have any children, or any props named children.'
      )
    }

    return (
      <Query
        query={typeof QUERY === 'function' ? QUERY(beforeQuery(props)) : QUERY}
        {...beforeQuery(props)}
      >
        {({ error, loading, data, ...queryRest }) => {
          if (error) {
            if (Failure) {
              return <Failure error={error} {...queryRest} {...props} />
            } else {
              throw error
            }
          } else if (loading) {
            return <Loading {...queryRest} {...props} />
          } else if (data) {
            if (typeof Empty !== 'undefined' && isEmpty(data)) {
              return <Empty {...queryRest} {...props} />
            } else {
              return <Success {...afterQuery(data)} {...queryRest} {...props} />
            }
          } else {
            throw new Error(
              'Cannot render cell: GraphQL success but `data` is null'
            )
          }
        }}
      </Query>
    )
  }
}
