import React, { useEffect, useState, useRef } from 'react'
import { useQuery } from '@apollo/react-hooks'
import { Query } from '@apollo/react-components'

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
