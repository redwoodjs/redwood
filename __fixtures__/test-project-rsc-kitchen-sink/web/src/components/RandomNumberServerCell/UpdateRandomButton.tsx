'use client'

import { updateRandom } from './actions.js'

export const UpdateRandomButton = () => {
  return (
    <button
      onClick={async () => {
        const res = await updateRandom()
        console.log('res', res)
      }}
    >
      Update
    </button>
  )
}
