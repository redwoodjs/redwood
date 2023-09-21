import type { Fruit } from 'types/graphql'

import { registerFragment } from '@redwoodjs/web/apollo'

import Card from 'src/components/Card/Card'
import Stall from 'src/components/Stall'

const { useRegisteredFragment } = registerFragment(
  gql`
    fragment Fruit_info on Fruit {
      id
      name
      isSeedless
      ripenessIndicators
      stall {
        ...Stall_info
      }
    }
  `
)

const Fruit = ({ id }: { id: string }) => {
  const { data: fruit, complete } = useRegisteredFragment<Fruit>(id)

  console.log(fruit)

  return (
    complete && (
      <Card>
        <h2 className="font-bold">Fruit Name: {fruit.name}</h2>
        <p>Seeds? {fruit.isSeedless ? 'Yes' : 'No'}</p>
        <p>Ripeness: {fruit.ripenessIndicators}</p>
        <Stall id={fruit.stall.id} />
      </Card>
    )
  )
}

export default Fruit
