import React from 'react'
import { Query } from '@apollo/react-components'

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
  Loading = () => 'Loading...',
  Failure,
  Empty,
  Success,
}) => {
  const isDataNull = (data) => {
    return dataField(data) === null
  }

  const isDataEmptyArray = (data) => {
    return Array.isArray(dataField(data)) && dataField(data).length === 0
  }

  const dataField = (data) => {
    return data[Object.keys(data)[0]]
  }

  const isEmpty = (data) => {
    return isDataNull(data) || isDataEmptyArray(data)
  }

  return (props) => (
    <Query
      query={typeof QUERY === 'function' ? QUERY(beforeQuery(props)) : QUERY}
      {...beforeQuery(props)}
    >
      {({ error, loading, data, ...queryRest }) => {
        if (error) {
          if (Failure) {
            return <Failure error={error} {...queryRest} {...props} />
          } else {
            console.error(error)
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
          throw 'Cannot render cell: graphQL success but `data` is null'
        }
      }}
    </Query>
  )
}
