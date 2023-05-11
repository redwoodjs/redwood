import React from 'react'

import { LinkIcon } from '@heroicons/react/20/solid'
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'

import { featureDisplayNames, featureIcons, featureColours } from './features'

export default function FeatureLink({ feature }: { feature: any }) {
  if (feature.type == null) {
    return <></>
  }

  const Icon = featureIcons.get(feature.type) || QuestionMarkCircleIcon
  return (
    <div
      key={feature.id}
      className="relative flex items-center space-x-3 rounded-md border border-gray-300 bg-white px-4 py-2 shadow-sm hover:border-gray-400"
    >
      <Icon
        className={`h-5 w-5 ${featureColours.get(feature.type)}`}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1 flex-row">
        <div className="flex flex-col">
          <p className="text-sm font-medium text-gray-900">
            {featureDisplayNames.get(feature.type)}
          </p>
          <p className="truncate text-sm text-gray-500">
            {feature.brief || feature.id}
          </p>
        </div>
      </div>
      <Link to={`/explorer/span/${feature.id}`}>
        <LinkIcon className="h-5 w-5 text-cyan-400" />
      </Link>
    </div>
  )
}
