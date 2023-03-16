import React from 'react'

import {
  CircleStackIcon,
  CodeBracketIcon,
  ShareIcon,
} from '@heroicons/react/24/outline'

const featureNameMapping = {
  sql: 'SQL',
  service_function: 'Service Function',
  graphql: 'GraphQL',
} as { [key: string]: string }

const featureIconMapping = {
  sql: CircleStackIcon,
  service_function: CodeBracketIcon,
  graphql: ShareIcon,
} as {
  [key: string]: React.ForwardRefExoticComponent<React.SVGProps<SVGSVGElement>>
}

const featureColourMapping = {
  sql: 'cyan-500',
  service_function: 'fuchsia-500',
  graphql: 'orange-500',
} as { [key: string]: string }

function EnhancementList({
  enhancementFeatures,
}: {
  enhancementFeatures: string[]
}) {
  const featureKeys = Object.keys(featureNameMapping)
  return (
    <div className="sm:flex">
      {enhancementFeatures.sort().map((feature) => {
        if (featureKeys.includes(feature)) {
          const Icon = featureIconMapping[feature]
          return (
            <p
              key={feature}
              className={`flex items-center text-sm text-${featureColourMapping[feature]} pr-2`}
            >
              <Icon
                className={`mr-1.5 h-5 w-5 flex-shrink-0 text-${featureColourMapping[feature]}`}
                aria-hidden="true"
              />
              {featureNameMapping[feature]}
            </p>
          )
        }
        return <></>
      })}
    </div>
  )
}

export default EnhancementList
