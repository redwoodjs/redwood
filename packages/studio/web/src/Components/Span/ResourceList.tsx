import React from 'react'

import {
  Card,
  Flex,
  List,
  ListItem,
  Subtitle,
  Text,
  Title,
} from '@tremor/react'

function displayValue(value: any) {
  try {
    return <pre>{JSON.stringify(JSON.parse(value), undefined, 2)}</pre>
  } catch (error) {
    return <Text>{value}</Text>
  }
}

export default function ResourceList({ resources }: { resources: JSON }) {
  const data = Object.entries(resources).map(([name, value]) => ({
    name,
    value,
  }))

  return (
    <Card className="min-w-full">
      <Flex className="flex-col items-start">
        <Title>Span Resources</Title>
        <Subtitle>OpenTelemetry resources for this span</Subtitle>
        <List className="mt-2">
          {data.map((d) => (
            <ListItem key={d.name}>
              <Text>{d.name}</Text>
              {displayValue(d.value)}
            </ListItem>
          ))}
        </List>
      </Flex>
    </Card>
  )
}
