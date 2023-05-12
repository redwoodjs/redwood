import React from 'react'

import { BarsArrowUpIcon } from '@heroicons/react/20/solid'

import FeatureLink from './FeatureLink'

export default function AncestorFeatureList({ features }: { features: any[] }) {
  return (
    <div className="overflow-hidden bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6 flex flex-col gap-2">
        <div className="text-base font-semibold flex flex-row items-center gap-1">
          <BarsArrowUpIcon className="flex h-5 w-5" />
          <div className="flex-1">Ancestor Features</div>
        </div>
        {features.length === 0 ? (
          <div className="italic text-gray-500">None found...</div>
        ) : (
          <>
            {features.map((feature: any) => (
              <FeatureLink key={feature.id} feature={feature} />
            ))}
          </>
        )}
      </div>
    </div>
  )
}
