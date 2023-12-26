import React from 'react'

import { useQuery, gql } from '@apollo/client'
import { Link, useParams } from 'react-router-dom'

import SpanTreeMapChart from '../../Charts/SpanTreeMapChart'
import LoadingSpinner from '../../Components/LoadingSpinner'
import ErrorPanel from '../../Components/Panels/ErrorPanel'
import WarningPanel from '../../Components/Panels/WarningPanel'
import SpanDetails from '../../Components/Span/SpanDetails'
import { ITEM_POLLING_INTERVAL } from '../../util/polling'

const GET_SPAN_DATA = gql`
  query GetSpanData($id: String!) {
    span(spanId: $id) {
      id
      type
      name
      brief
      trace
      parent
      startNano
      endNano
      durationNano
      kind
      statusCode
      statusMessage
      ancestorSpans {
        id
        type
        name
        parent
      }
    }
    spanTreeMapData(spanId: $id)
  }
`

export default function SpanTreeMap() {
  const { spanId } = useParams()
  const { loading, error, data } = useQuery(GET_SPAN_DATA, {
    variables: { id: spanId },
    pollInterval: ITEM_POLLING_INTERVAL,
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

  if (spanId === undefined || data.span == null) {
    return (
      <div className="mx-auto py-6 px-4 max-w-[97.5%] md:max-w-[90%] sm:px-6 lg:px-8 flex justify-center">
        <WarningPanel
          warning={{
            spanId: spanId,
            message: `Unable to find any data for this span.`,
          }}
        />
      </div>
    )
  }

  const getParents = (parentId: string) => {
    const parents: string[] = []
    const parent = data.span.ancestorSpans.find(
      (span: any) => span.id === parentId
    )
    if (parent) {
      if (parent.parent) {
        parents.push(...getParents(parent.parent))
      }
      parents.push(parent.id)
    }
    return parents
  }

  const breadcrumIds = [...getParents(data.span.parent), spanId]

  return (
    <div className="mx-auto py-6 px-4 max-w-[97.5%] md:max-w-[90%] sm:px-6 lg:px-8">
      {/* Header  */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-slate-100 px-4 pt-2 pb-2 bg-rich-black rounded-md">
            Tree Map: What happened in this span?
          </h1>
        </div>
      </div>

      <div className="overflow-hidden bg-white shadow rounded-md mt-4 min-h-[500px] h-[500px]">
        <SpanTreeMapChart data={data.spanTreeMapData || {}} />
      </div>

      <div className="overflow-hidden bg-white shadow rounded-md mt-4 p-3 flex flex-row overflow-x-auto">
        {breadcrumIds.map((id, index) => (
          <>
            <Link
              to={`/explorer/map/${id}`}
              key={id}
              className={id === spanId ? `text-sinopia underline` : ``}
            >
              {id}
            </Link>
            {index !== breadcrumIds.length - 1 && (
              <span className="mx-1">&gt;</span>
            )}
          </>
        ))}
      </div>

      <div className="mt-4">
        <SpanDetails span={data.span} />
      </div>
    </div>
  )
}
