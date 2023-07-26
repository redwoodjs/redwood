import React from 'react'

import { useQuery, gql } from '@apollo/client'
import { Bold, Card, Flex, Text, Title } from '@tremor/react'
import { useParams } from 'react-router-dom'

import AncestorFeatureList from '../../Components/Feature/AncestorFeatureList'
import DescendantFeatureList from '../../Components/Feature/DescendantFeatureList'
import LoadingSpinner from '../../Components/LoadingSpinner'
import ErrorPanel from '../../Components/Panels/ErrorPanel'
import EventList from '../../Components/Span/EventList'
import ResourceList from '../../Components/Span/ResourceList'
import SpanDetails from '../../Components/Span/SpanDetails'
import { ITEM_POLLING_INTERVAL } from '../../util/polling'
import { displayTextOrJSON } from '../../util/ui'

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
        statusCode
      }
      ancestorSpans {
        id
        type
        brief
        statusCode
      }
    }
  }
`

export default function Span() {
  const { spanId } = useParams()

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
      <Card className="min-w-full bg-rich-black py-2 px-6">
        <Flex>
          <Title className="text-slate-100">Generic Span</Title>
          <Title className="text-slate-100 font-mono">[{spanId}]</Title>
        </Flex>
      </Card>

      {/* Span data (TODO: Make this the specific type dependant panel) */}
      <div className="mt-4 grid lg:grid-cols-3 grid-cols-1 gap-2 lg:gap-4">
        <Card className="min-w-full lg:col-span-2 row-span-2">
          <Flex className="flex-col items-start overflow-auto">
            <Title className="mb-2">Span Attributes</Title>
            {Object.keys(data.span.attributes).map((key: any) => (
              <Flex key={key} className="flex-col items-start">
                <Text>
                  <Bold>{key}</Bold>
                </Text>
                {displayTextOrJSON(data.span.attributes[key])}
              </Flex>
            ))}
          </Flex>
        </Card>

        {/* Feature lists */}
        <AncestorFeatureList
          features={data.span.ancestorSpans.filter(
            (span: any) => span.type !== null
          )}
        />
        <DescendantFeatureList
          features={data.span.descendantSpans.filter(
            (span: any) => span.type !== null
          )}
        />

        {/* Other span data */}
        <SpanDetails span={data.span} />
        <ResourceList resources={data.span.resources} />
        <EventList events={data.span.events} spanId={data.span.id} />
      </div>
    </div>
  )
}
