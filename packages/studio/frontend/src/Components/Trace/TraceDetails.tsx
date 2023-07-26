import React from 'react'

import { LinkIcon } from '@heroicons/react/20/solid'
import {
  Card,
  Flex,
  Title,
  Subtitle,
  List,
  ListItem,
  Text,
} from '@tremor/react'
import { Link } from 'react-router-dom'

import {
  getTraceName,
  traceDuration,
  traceEnd,
  traceStart,
} from '../../util/trace'

export default function TraceDetails({ trace }: { trace: any }) {
  const data = [
    {
      name: 'Trace ID',
      value: (
        <Flex className="justify-end">
          <Link to={`/explorer/trace/${trace.id}`} className="pr-2">
            <LinkIcon className="h-5 w-5 text-cyan-400" />
          </Link>
          <Text>{trace.id}</Text>
        </Flex>
      ),
    },
    {
      name: 'Span Count',
      value: <Text>{trace.spans.length}</Text>,
    },
    {
      name: 'Root Span Count',
      value: (
        <Text>
          {trace.spans.filter((span: any) => span.parent == null).length}
        </Text>
      ),
    },
    {
      name: 'Root Span Names',
      value: <Text>{getTraceName(trace.spans)}</Text>,
    },
    {
      name: 'Start (ns)',
      value: <Text>{traceStart(trace.spans)}</Text>,
    },
    {
      name: 'End (ns)',
      value: <Text>{traceEnd(trace.spans)}</Text>,
    },
    {
      name: 'Duration (ns)',
      value: <Text>{traceDuration(trace.spans)}</Text>,
    },
  ]

  return (
    <Card className="min-w-full">
      <Flex className="flex-col items-start">
        <Title>Trace Metadata</Title>
        <Subtitle>Metadata associated with this trace</Subtitle>
        <List className="mt-2">
          {data.map((d) => (
            <ListItem key={d.name}>
              <Text>{d.name}</Text>
              {d.value}
            </ListItem>
          ))}
        </List>
      </Flex>
    </Card>
  )
}
