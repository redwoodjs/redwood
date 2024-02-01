import type { Produce } from 'types/graphql'

import { registerFragment } from '@redwoodjs/web/apollo'

import Card from 'src/components/Card'

const { useRegisteredFragment } = registerFragment(
  gql`
    fragment Produce_info on Produce {
      id
      name
    }
  `
)

const ProduceInfo = ({ id }: { id: string }) => {
  const { data, complete } = useRegisteredFragment<Produce>(id)

  return (
    complete && (
      <Card>
        <h2 className="font-bold">Produce Name: {data.name}</h2>
      </Card>
    )
  )
}

export default ProduceInfo
