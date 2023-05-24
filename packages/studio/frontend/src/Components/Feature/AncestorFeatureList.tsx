import React from 'react'

import { BarsArrowUpIcon } from '@heroicons/react/20/solid'
import { Card, Flex, Title, Italic, Text } from '@tremor/react'

import FeatureLink from './FeatureLink'

export default function AncestorFeatureList({ features }: { features: any[] }) {
  return (
    <Card className="min-w-full">
      <Flex className="flex-col gap-2 items-start">
        <Flex>
          <BarsArrowUpIcon className="flex h-5 w-5 mr-2" />
          <Title className="flex-1">Ancestor Features</Title>
        </Flex>
        {features.length === 0 ? (
          <Text>
            <Italic>None found...</Italic>
          </Text>
        ) : (
          <>
            {features.map((feature: any) => (
              <FeatureLink key={feature.id} feature={feature} />
            ))}
          </>
        )}
      </Flex>
    </Card>
  )
}
