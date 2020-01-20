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
 * @param {Component=} Error - Something went wrong, render this component
 * @param {Component} Success - Data has loaded, render this component
 *
 * @example
 * ```js
 * // IMPLEMENTATION:
 * // `src/ExampleComponent/index.js`. This file will be removed and
 * // automatically dealt with in babel.
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
  beforeQuery = () => ({}),
  QUERY,
  afterQuery = (data) => ({ ...data }),
  Loading = () => null,
  Error = () => null,
  Empty = () => null,
  Success,
}) => {
  return (props) => (
    <Query query={QUERY} {...beforeQuery(props)}>
      {({ error, loading, data, ...queryRest }) => {
        if (error) {
          if (Error) {
            return <Error error={error} {...queryRest} {...props} />
          } else {
            console.error(error)
          }
        } else if (loading) {
          return <Loading {...queryRest} {...props} />
        } else if (
          data === null ||
          (Array.isArray(data) && Array.isEmpty(data) && Empty)
        ) {
          return <Empty {...queryRest} {...props} />
        } else {
          return <Success {...afterQuery(data)} {...queryRest} {...props} />
        }
      }}
    </Query>
  )
}
