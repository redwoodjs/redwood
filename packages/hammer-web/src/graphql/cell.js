import React, { useEffect, useState, useRef } from 'react'
import { useQuery } from '@apollo/react-hooks'
import { Query } from '@apollo/react-components'

// HOC version

export const WithCell = ({
  query,
  queryOptions,
  parseData = (data) => ({ ...data }),
  Loader = () => null,
  Error = () => null,
  Component,
  componentProps,
}) => {
  console.log('hello?')
  return (
    <Query query={query} queryOptions={queryOptions}>
      {({ error, loading, data, ...queryRest }) => {
        if (error) {
          return <Error error={error} {...queryRest} {...componentProps} />
        } else if (loading) {
          return <Loader {...queryRest} {...componentProps} />
        } else {
          console.log('margle')
          return (
            <Component
              {...parseData(data)}
              {...queryRest}
              {...componentProps}
            />
          )
        }
      }}
    </Query>
  )
}

export const useCell = (
  {
    query,
    Loader = () => null,
    Error = () => null,
    parseData = (data) => ({ ...data }),
    Component,
    componentProps,
  },
  queryOptions
) => {
  const result = useRef(null)
  const [status, setStatus] = useState('idle')
  const { error, loading, data, ...queryRest } = useQuery(query, queryOptions)

  // we need to manually run reconciliation for some reason,
  // I'm sure there's something here that I'm not entirely
  // grokking... maybe it's because I'm using the hook.

  useEffect(() => {
    if (error) {
      result.current = (
        <Error error={error} {...queryRest} {...componentProps} />
      )
      setStatus('error')
    } else if (loading) {
      result.current = <Loader {...queryRest} {...componentProps} />
      setStatus('loading')
    } else {
      result.current = (
        <Component {...parseData(data)} {...queryRest} {...componentProps} />
      )
      setStatus(`complete`)
    }
  }, [error, loading, data, parseData, status, queryRest, componentProps])

  return result.current
}
