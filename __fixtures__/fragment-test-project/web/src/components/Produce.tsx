import type { Produce } from 'types/graphql'

import { registerFragment } from '@redwoodjs/web/apollo'

import Card from 'src/components/Card/Card'

const { useRegisteredFragment } = registerFragment(
  gql`
    fragment Produce_info on Produce {
      id
      name
    }
  `
)

const Produce = ({ id }: { id: string }) => {
  const { data, complete } = useRegisteredFragment<Produce>(id)

  console.log('>>>>>>>>>>>Produce', data)

  return (
    complete && (
      <Card>
        <h2 className="font-bold">Produce Name: {data.name}</h2>
      </Card>
    )
  )
}

export default Produce
