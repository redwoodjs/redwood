import type { DocumentNode } from 'graphql'
import type {
  BaseQueryOptions,
  OperationVariables,
  QueryResult,
} from '@apollo/client'

import React from 'react'
import { useQuery } from '@apollo/client'

/**
 * Graciously borrowed from Apollo. We'll move over to a hooks version.
 *
 */
// @ts-expect-error - no.
const Query = ({ children, query, ...rest }) => {
  const result = useQuery(query, rest)
  return children && result ? children(result) : null
}

export type DataObject = { [key: string]: unknown }

export type QueryResultAlias = QueryResult<any, Record<string, any>>

export type CellFailureStateComponent = Omit<
  QueryResultAlias,
  'data' | 'loading'
>
export type CellLoadingEmptyStateComponent = Omit<
  QueryResultAlias,
  'error' | 'loading' | 'data'
>
export type CellSuccessStateComponent =
  | Omit<QueryResultAlias, 'error' | 'loading' | 'data'>
  | DataObject

export type WithCellProps = {
  beforeQuery?: (props: OperationVariables) => BaseQueryOptions
  QUERY: DocumentNode | ((before: BaseQueryOptions) => DocumentNode)
  afterQuery?: (data: DataObject) => DataObject
  Loading?: React.FC<CellLoadingEmptyStateComponent>
  Failure?: React.FC<CellFailureStateComponent>
  Empty?: React.FC<CellLoadingEmptyStateComponent>
  Success: React.FC<CellSuccessStateComponent>
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
export const withCell = ({
  beforeQuery = (props) => ({
    variables: props,
  }),
  QUERY,
  afterQuery = (data) => ({ ...data }),
  Loading = () => <>Loading...</>,
  Failure,
  Empty,
  Success,
}: WithCellProps) => {
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

  return (props: OperationVariables) => (
    <Query
      query={typeof QUERY === 'function' ? QUERY(beforeQuery(props)) : QUERY}
      {...beforeQuery(props)}
    >
      {({ error, loading, data, ...queryRest }: QueryResultAlias) => {
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
            'Cannot render cell: graphQL success but `data` is null'
          )
        }
        return null
      }}
    </Query>
  )
}
