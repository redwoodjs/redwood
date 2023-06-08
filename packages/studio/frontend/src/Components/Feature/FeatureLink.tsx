import React from 'react'

import { LinkIcon } from '@heroicons/react/20/solid'
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline'
import { Card, Flex } from '@tremor/react'
import { Link } from 'react-router-dom'

import { featureDisplayNames, featureIcons, featureColours } from './features'

export default function FeatureLink({ feature }: { feature: any }) {
  const Icon = featureIcons.get(feature.type) || QuestionMarkCircleIcon
  return (
    <Card
      className="min-w-full px-4 py-2"
      decoration={feature.statusCode === 2 ? 'left' : undefined}
      decorationColor="red"
    >
      <Flex className="space-x-3">
        <Icon
          className={`h-5 w-5 ${featureColours.get(feature.type)}`}
          aria-hidden="true"
        />
        <div className="flex-1 flex-col items-start min-w-0">
          <p className="text-sm font-medium text-gray-900 min-w-0">
            {featureDisplayNames.get(feature.type)}
          </p>
          <p className="truncate text-sm text-gray-500 min-w-0">
            {feature.brief || feature.id}
          </p>
        </div>
        <Link to={`/explorer/span/${feature.id}`}>
          <LinkIcon className="h-5 w-5 text-cyan-400" />
        </Link>
      </Flex>
    </Card>
  )
}
