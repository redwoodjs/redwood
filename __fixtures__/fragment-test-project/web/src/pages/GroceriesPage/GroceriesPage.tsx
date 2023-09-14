import type { GetGroceries, GetProduce } from 'types/graphql'

import { MetaTags } from '@redwoodjs/web'
import { useQuery } from '@redwoodjs/web'

import Fruit from 'src/components/Fruit'
import Produce from 'src/components/Produce'
import Vegetable from 'src/components/Vegetable'

const GET_GROCERIES = gql`
  query GetGroceries {
    groceries {
      ...Fruit_info
      ...Vegetable_info
    }
  }
`

const GET_PRODUCE = gql`
  query GetProduce {
    produce {
      ...Produce_info
    }
  }
`

const FruitsPage = () => {
  const { data: groceryData, loading: groceryLoading } =
    useQuery<GetGroceries>(GET_GROCERIES)
  const { data: produceData, loading: produceLoading } =
    useQuery<GetProduce>(GET_PRODUCE)

  return (
    <div className="m-12">
      <MetaTags title="Groceries" description="Groceries page" />

      <div className="grid auto-cols-auto gap-4 grid-cols-4">
        {!groceryLoading &&
          groceryData.groceries.map((fruit) => (
            <Fruit key={fruit.id} id={fruit.id} />
          ))}

        {!groceryLoading &&
          groceryData.groceries.map((vegetable) => (
            <Vegetable key={vegetable.id} id={vegetable.id} />
          ))}

        {!produceLoading &&
          produceData.produce.map((produce) => ( 
            <Produce key={produce.id} id={produce.id} />
          ))}
      </div>
    </div>
  )
}

export default FruitsPage
