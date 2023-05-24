import React from 'react'

import { LinkIcon } from '@heroicons/react/20/solid'
import {
  Card,
  Flex,
  Italic,
  List,
  ListItem,
  Subtitle,
  Text,
  Title,
} from '@tremor/react'
import { Link } from 'react-router-dom'

const getSpanKindName = (kind: string | number) => {
  switch (kind.toString()) {
    case '0':
      return 'Internal'
    case '1':
      return 'Server'
    case '2':
      return 'Client'
    case '3':
      return 'Producer'
    case '4':
      return 'Consumer'
    default:
      return <span className="italic">Unknown: {kind}</span>
  }
}

const getSpanStatusCodeName = (code: string | number) => {
  switch (code.toString()) {
    case '0':
      return 'Unset'
    case '1':
      return 'Ok'
    case '2':
      return 'Error'
    default:
      return <span className="italic">Unknown: {code}</span>
  }
}

export default function SpanDetails({ span }: { span: any }) {
  const data = [
    {
      name: 'Span ID',
      value: (
        <Flex className="justify-end">
          <Link to={`/explorer/span/${span.id}`} className="pr-2">
            <LinkIcon className="h-5 w-5 text-cyan-400" />
          </Link>
          <Text>{span.id}</Text>
        </Flex>
      ),
    },
    {
      name: 'Trace ID',
      value: (
        <Flex className="justify-end">
          <Link to={`/explorer/trace/${span.trace}`} className="pr-2">
            <LinkIcon className="h-5 w-5 text-cyan-400" />
          </Link>
          <Text>{span.trace}</Text>
        </Flex>
      ),
    },
    {
      name: 'Parent ID',
      value: span.parent ? (
        <Flex className="justify-end">
          <Link to={`/explorer/span/${span.parent}`} className="pr-2">
            <LinkIcon className="h-5 w-5 text-cyan-400" />
          </Link>
          <Text>{span.parent}</Text>
        </Flex>
      ) : (
        <Text>
          <Italic>No parent</Italic>
        </Text>
      ),
    },
    {
      name: 'Name',
      value: <Text>{span.name}</Text>,
    },
    {
      name: 'Kind',
      value: <Text>{getSpanKindName(span.kind)}</Text>,
    },
    {
      name: 'Status Code',
      value: <Text>{getSpanStatusCodeName(span.statusCode)}</Text>,
    },
    {
      name: 'Status Message',
      value: span.statusMessage ? (
        <Text>{span.statusMessage}</Text>
      ) : (
        <Text>
          <Italic>No message</Italic>
        </Text>
      ),
    },
    {
      name: 'Start (ns)',
      value: <Text>{span.startNano}</Text>,
    },
    {
      name: 'End (ns)',
      value: <Text>{span.endNano}</Text>,
    },
    {
      name: 'Duration (ns)',
      value: <Text>{span.durationNano}</Text>,
    },
  ]

  return (
    <Card className="min-w-full">
      <Flex className="flex-col items-start">
        <Title>Span Metadata</Title>
        <Subtitle>OpenTelemetry metadata associated with this span</Subtitle>
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
