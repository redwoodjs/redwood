import React from 'react'
import { Query } from '@apollo/react-components'

export const withCell = ({
  query,
  parseData = (data) => ({ ...data }),
  Loader = () => null,
  Error = () => null,
  default: Component,
}) => {
  return ({ queryOptions, ...rest }) => (
    <Query query={query} {...queryOptions}>
      {({ error, loading, data, ...queryRest }) => {
        if (error) {
          return <Error error={error} {...queryRest} {...rest} />
        } else if (loading) {
          return <Loader {...queryRest} {...rest} />
        } else {
          return <Component {...parseData(data)} {...queryRest} {...rest} />
        }
      }}
    </Query>
  )
}
