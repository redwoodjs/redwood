import React from 'react'
import { Query } from '@apollo/react-components'

export const withCell = ({
  query,
  queryOptions,
  parseData = (data) => ({ ...data }),
  Loader = () => null,
  Error = () => null,
  default: Component,
}) => {
  return (props) => (
    <Query query={query} queryOptions={queryOptions}>
      {({ error, loading, data, ...queryRest }) => {
        if (error) {
          return <Error error={error} {...queryRest} {...props} />
        } else if (loading) {
          return <Loader {...queryRest} {...props} />
        } else {
          return <Component {...parseData(data)} {...queryRest} {...props} />
        }
      }}
    </Query>
  )
}
