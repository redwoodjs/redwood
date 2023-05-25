import React from 'react'

import { LinkIcon } from '@heroicons/react/20/solid'
import { Bold, Card, Flex, Text } from '@tremor/react'
import { Link } from 'react-router-dom'

export default function ErrorEventLink({
  event,
  spanId,
}: {
  event: any
  spanId: string
}) {
  const attributeCount = Object.keys(event.attributes || {}).length
  return (
    <Card
      className="min-w-full px-4 py-2"
      decoration="left"
      decorationColor="red"
    >
      <Flex className="space-x-3">
        <div className="flex-1 flex-col items-start min-w-0">
          <Text>
            <Bold className="mr-1">{event.name}</Bold>(
            {attributeCount === 1
              ? '1 attribute'
              : `${attributeCount} attributes`}
            )
          </Text>
          <Text>
            {new Date(Number(event.time / BigInt(1e6))).toISOString()}
          </Text>
        </div>
        <Link to={`/monitor/error/${spanId}/${event.time}`}>
          <LinkIcon className="h-5 w-5 text-cyan-400" />
        </Link>
      </Flex>
    </Card>
  )
}
