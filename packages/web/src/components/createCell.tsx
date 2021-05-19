import { useQuery, OperationResult } from './GraphQLHooksProvider'

import type { DocumentNode } from 'graphql'

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
export type CellSuccessStateComponent =
  | Omit<OperationResult, 'error' | 'loading' | 'data'>
  | DataObject

export interface CreateCellProps<CellProps> {
  beforeQuery?: <TProps>(props: TProps) => { variables: TProps }
  QUERY: DocumentNode | ((variables: Record<string, unknown>) => DocumentNode)
  afterQuery?: (data: DataObject) => DataObject
  Loading?: React.FC<CellLoadingEmptyStateComponent & Partial<CellProps>>
  Failure?: React.FC<CellFailureStateComponent & Partial<CellProps>>
  Empty?: React.FC<CellLoadingEmptyStateComponent & Partial<CellProps>>
  Success: React.FC<CellSuccessStateComponent & Partial<CellProps>>
}

/**
 * Is a higher-order-component that executes a GraphQL query and automatically
 * manages the lifecycle of that query. If you export named parameters that match
 * the required params of `createCell` it will be automatically wrapped in this
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
 * import { createCell } from '@redwoodjs/web'
 * import * as cell from './ExampleComponent'
 *
 * export default createCell(cell)
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

export function createCell<CellProps = any>({
  beforeQuery = (props) => ({
    variables: props,
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  }),
  QUERY,
  afterQuery = (data) => ({ ...data }),
  Loading = () => <>Loading...</>,
  Failure,
  Empty,
  Success,
}: CreateCellProps<CellProps>): React.FC<CellProps> {
  // If its prerendering, render the Cell's Loading component
  if (global.__REDWOOD__PRERENDERING) {
    return (props) => <Loading {...props} />
  }

  return (props) => {
    const {
      children, // eslint-disable-line @typescript-eslint/no-unused-vars
      ...variables
    } = props

    return (
      <Query
        query={
          typeof QUERY === 'function' ? QUERY(beforeQuery(variables)) : QUERY
        }
        {...beforeQuery(variables)}
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
