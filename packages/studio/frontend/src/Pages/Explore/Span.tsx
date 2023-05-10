import React from 'react'

import { useQuery, gql } from '@apollo/client'
import { useParams } from 'react-router-dom'

import LoadingSpinner from '../../Components/LoadingSpinner'
import ErrorPanel from '../../Components/Panels/ErrorPanel'
import WarningPanel from '../../Components/Panels/WarningPanel'

import SpanGeneric from './SpanGeneric'

const GET_SPAN_TYPE = gql`
  query GetSpanType($spanId: String!) {
    span(spanId: $spanId) {
      id
      type
    }
  }
`

export default function Span() {
  const { spanId } = useParams()

  const { loading, error, data } = useQuery(GET_SPAN_TYPE, {
    variables: { spanId },
    pollInterval: 5_000,
  })

  if (error) {
    return (
      <div className="mx-auto py-6 px-4 max-w-[97.5%] md:max-w-[90%] sm:px-6 lg:px-8 flex justify-center">
        <ErrorPanel error={error} />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="mx-auto py-6 px-4 max-w-[97.5%] md:max-w-[90%] sm:px-6 lg:px-8 flex justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (data.span == null) {
    return (
      <div className="mx-auto py-6 px-4 max-w-[97.5%] md:max-w-[90%] sm:px-6 lg:px-8 flex justify-center">
        <WarningPanel
          warning={{
            spanId,
            message: `Unable to find any data for this span.`,
          }}
        />
      </div>
    )
  }

  switch (data.span.type) {
    // case 'http':
    //   return <SpanHTTP id={data.span.id}></SpanHTTP>
    default:
      return <SpanGeneric id={data.span.id}></SpanGeneric>
  }

  // return <>{spanId}</>
}
