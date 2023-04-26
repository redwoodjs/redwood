import React from 'react'

import { useQuery, gql } from '@apollo/client'

import AncestorFeatureList from '../../Components/Feature/AncestorFeatureList'
import DescendantFeatureList from '../../Components/Feature/DescendantFeatureList'
import LoadingSpinner from '../../Components/LoadingSpinner'
import ErrorPanel from '../../Components/Panels/ErrorPanel'
import EventList from '../../Components/Span/EventList'
import ResourceList from '../../Components/Span/ResourceList'
import SpanDetails from '../../Components/Span/SpanDetails'
import { ITEM_POLLING_INTERVAL } from '../../util/polling'

const GET_SPAN_DATA = gql`
  query GetSpanData($spanId: String!) {
    span(spanId: $spanId) {
      id
      type
      trace
      parent
      name
      kind
      statusCode
      statusMessage
      startNano
      endNano
      durationNano
      attributes
      events
      resources
      descendantSpans {
        id
        type
        brief
      }
      ancestorSpans {
        id
        type
        brief
      }
    }
  }
`

const attemptJSONDisplay = (value: any) => {
  try {
    return (
      <pre className="overflow-auto">
        {JSON.stringify(JSON.parse(value), null, 2)}
      </pre>
    )
  } catch {
    return value
  }
}

export default function SpanGeneric({ id: spanId }: { id: string }) {
  const { loading, error, data } = useQuery(GET_SPAN_DATA, {
    variables: { spanId },
    pollInterval: ITEM_POLLING_INTERVAL,
  })

  if (error) {
    return <ErrorPanel error={error} />
  }

  if (loading) {
    return (
      <div className="mx-auto py-6 px-4 max-w-[97.5%] md:max-w-[90%] sm:px-6 lg:px-8 flex justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="mx-auto py-6 px-4 max-w-[97.5%] md:max-w-[90%] sm:px-6 lg:px-8">
      {/* Header  */}
      <div className="sm:flex sm:items-center" key="header">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-slate-100 px-4 pt-2 pb-2 bg-rich-black rounded-md">
            Generic Span
          </h1>
        </div>
      </div>

      <div className="mt-4 grid md:grid-cols-3 grid-cols-1 gap-2 md:gap-4">
        <div className="overflow-hidden bg-white row-span-2 md:col-span-2 shadow rounded-md">
          <div className="px-4 py-5 sm:p-6 flex flex-col gap-2">
            <div className="text-base font-semibold">Span Attributes</div>
            <div>
              {Object.keys(data.span.attributes).map((key: any) => (
                <div key={key} className="flex flex-col gap-0 pb-2">
                  <div className="text-sm font-semibold">{key}</div>
                  <div className="text-sm">
                    <code>{attemptJSONDisplay(data.span.attributes[key])}</code>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Feature lists */}
        <DescendantFeatureList features={data.span.descendantSpans} />
        <AncestorFeatureList features={data.span.ancestorSpans} />

        {/* Other span data */}
        <div className="overflow-hidden bg-white shadow rounded-md">
          <div className="px-4 py-5 sm:p-6 flex flex-col gap-2">
            <SpanDetails span={data.span} />
          </div>
        </div>
        <div className="overflow-hidden bg-white shadow rounded-md">
          <div className="px-4 py-5 sm:p-6 flex flex-col gap-2">
            <ResourceList resources={data.span.resources} />
          </div>
        </div>
        <div className="overflow-hidden bg-white shadow rounded-md">
          <div className="px-4 py-5 sm:p-6 flex flex-col gap-2">
            <EventList events={data.span.events} />
          </div>
        </div>
      </div>
    </div>
  )
}
