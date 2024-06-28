import type { Stall } from 'types/graphql'

import { registerFragment } from '@redwoodjs/web/apollo'

const { useRegisteredFragment } = registerFragment(
  gql`
    fragment Stall_info on Stall {
      id
      name
    }
  `
)

const StallInfo = ({ id }: { id: string }) => {
  const { data, complete } = useRegisteredFragment<Stall>(id)

  return (
    complete && (
      <div>
        <h3 className="font-semibold">Stall Name: {data.name}</h3>
      </div>
    )
  )
}

export default StallInfo
