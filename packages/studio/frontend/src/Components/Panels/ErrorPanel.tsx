import React from 'react'

import { ExclamationTriangleIcon } from '@heroicons/react/20/solid'
import { Callout } from '@tremor/react'

export default function ErrorPanel({ error }: { error: any }) {
  return (
    <Callout
      className="w-full min-h-12"
      title="An error occurred"
      icon={ExclamationTriangleIcon}
      color="rose"
    >
      <pre>{JSON.stringify(error, undefined, 2)}</pre>
    </Callout>
  )
}
