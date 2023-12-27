import React from 'react'

import { ExclamationCircleIcon } from '@heroicons/react/20/solid'
import { Callout } from '@tremor/react'

export default function WarningPanel({ warning }: { warning: any }) {
  return (
    <Callout
      className="w-full min-h-12"
      title="A warning"
      icon={ExclamationCircleIcon}
      color="orange"
    >
      <pre>{JSON.stringify(warning, undefined, 2)}</pre>
    </Callout>
  )
}
