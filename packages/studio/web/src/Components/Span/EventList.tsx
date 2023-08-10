import React from 'react'

import { Card, Flex, Italic, Subtitle, Text, Title } from '@tremor/react'

import ErrorEventLink from '../Event/ErrorEventLink'
import EventModal from '../Event/EventModal'

export default function EventList({
  events,
  spanId,
}: {
  events: any[]
  spanId: string
}) {
  const data = events?.sort((a, b) =>
    a.time < b.time ? -1 : a.time > b.time ? 1 : 0
  )

  return (
    <Card className="min-w-full">
      <Flex className="flex-col items-start gap-2">
        <Title>Span Events</Title>
        <Subtitle>OpenTelemetry events recorded</Subtitle>
        {data.length === 0 ? (
          <Text className="mt-2">
            <Italic>No events recorded...</Italic>
          </Text>
        ) : (
          data.map((event) => {
            if (event.name === 'exception') {
              return (
                <ErrorEventLink
                  key={`${event.name}-${event.time}`}
                  event={event}
                  spanId={spanId}
                />
              )
            }
            return (
              <EventModal key={`${event.name}-${event.time}`} event={event} />
            )
          })
        )}
      </Flex>
    </Card>
  )
}
