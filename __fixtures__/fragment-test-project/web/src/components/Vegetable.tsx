import type { Vegetable } from 'types/graphql'

import { registerFragment } from '@redwoodjs/web/apollo'

import Card from 'src/components/Card/Card'
import Stall from 'src/components/Stall'

const { useRegisteredFragment } = registerFragment(
  gql`
    fragment Vegetable_info on Vegetable {
      id
      name
      vegetableFamily
      isPickled
      stall {
        ...Stall_info
      }
    }
  `
)

const Vegetable = ({ id }: { id: string }) => {
  const { data: vegetable, complete } = useRegisteredFragment<Vegetable>(id)

  console.log(vegetable)

  return (
    complete && (
      <Card>
        <h2 className="font-bold">Vegetable Name: {vegetable.name}</h2>
        <p>Pickled? {vegetable.isPickled ? 'Yes' : 'No'}</p>
        <p>Family: {vegetable.vegetableFamily}</p>
        <Stall id={vegetable.stall.id} />
      </Card>
    )
  )
}

export default Vegetable
