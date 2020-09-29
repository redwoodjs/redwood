import React from 'react'
import { Query } from '@apollo/client/react/components/Query'
import { DocumentNode } from 'graphql'
import {
  BaseQueryOptions,
  OperationVariables,
  QueryResult,
} from '@apollo/client'

type DataObjectType = { [key: string]: string }

type QueryResultType = QueryResult<any, Record<string, any>>

type CellFailureStateType = Omit<QueryResultType, 'data' | 'loading'>
type CellLoadingEmptyStateType = Omit<
  QueryResultType,
  'error' | 'loading' | 'data'
>
type CellSuccessStateType =
  | Omit<QueryResultType, 'error' | 'loading' | 'data'>
  | DataObjectType

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
    fetchPolicy: 'cache-and-network',
  }),
  QUERY,
  afterQuery = (data) => ({ ...data }),
  Loading = () => <div>Loading...</div>,
  Failure,
  Empty,
  Success,
}: {
  beforeQuery: (props: OperationVariables) => BaseQueryOptions
  QUERY: DocumentNode | ((before: BaseQueryOptions) => DocumentNode)
  afterQuery: (data: DataObjectType) => DataObjectType
  Loading: React.FC<CellLoadingEmptyStateType>
  Failure?: React.FC<CellFailureStateType>
  Empty?: React.FC<CellLoadingEmptyStateType>
  Success?: React.FC<CellSuccessStateType>
}) => {
  const isDataNull = (data: DataObjectType) => {
    return dataField(data) === null
  }

  const isDataEmptyArray = (data: DataObjectType) => {
    return Array.isArray(dataField(data)) && dataField(data).length === 0
  }

  const dataField = (data: DataObjectType) => {
    return data[Object.keys(data)[0]]
  }

  const isEmpty = (data: DataObjectType) => {
    return isDataNull(data) || isDataEmptyArray(data)
  }

  return (props: OperationVariables) => (
    <Query
      query={typeof QUERY === 'function' ? QUERY(beforeQuery(props)) : QUERY}
      {...beforeQuery(props)}
    >
      {({
        error,
        loading,
        data,
        ...queryRest
      }: QueryResult<any, Record<string, any>>) => {
        if (error) {
          if (Failure) {
            return <Failure error={error} {...queryRest} {...props} />
          } else {
            throw new Error((error as unknown) as string)
          }
        } else if (loading) {
          return <Loading {...queryRest} {...props} />
        } else if (data) {
          if (typeof Empty !== 'undefined' && isEmpty(data)) {
            return <Empty {...queryRest} {...props} />
          } else if (typeof Success !== 'undefined') {
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
