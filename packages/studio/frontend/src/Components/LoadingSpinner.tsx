import React from 'react'

import { Button } from '@tremor/react'

function LoadingSpinner({ colour }: { colour?: string }) {
  const _fill = colour ? `fill-[${colour}]` : 'fill-sinopia'
  return (
    <div className={`flex flex-row flex-shrink justify-center rounded-md p-2`}>
      <Button loading={true} loadingText="Loading..." color="slate" />
    </div>
  )
}

export default LoadingSpinner
