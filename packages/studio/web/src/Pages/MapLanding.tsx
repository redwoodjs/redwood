import React from 'react'

import {
  CubeTransparentIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/solid'
import { Callout, Flex, Text } from '@tremor/react'

export default function MapLanding() {
  return (
    <div className="flex flex-col justify-center sm:py-4 mx-auto max-w-[97.5%] md:max-w-[90%] px-6 lg:px-8">
      <Callout
        className="w-full min-h-12"
        title="Information notice"
        icon={InformationCircleIcon}
        color="cyan"
      >
        <Flex className="flex-col gap-2 items-start">
          <Text>
            Lookout for the icon below on various pages to access map views.
          </Text>
          <div className="flex-shrink bg-rich-black text-white rounded-md items-center justify-center p-2">
            <CubeTransparentIcon className="h-8 w-8" />
          </div>
        </Flex>
      </Callout>
    </div>
  )
}
