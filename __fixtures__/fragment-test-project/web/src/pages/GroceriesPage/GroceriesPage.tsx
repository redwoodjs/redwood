import type { GetGroceries } from 'types/graphql'

import { MetaTags } from '@redwoodjs/web'
import { useQuery } from '@redwoodjs/web'

const GET_PRODUCE = gql`
  query GetGroceries {
    groceries {
      ... on Fruit {
        id
        name
        isSeedless
        ripenessIndicators
      }
      ... on Vegetable {
        id
        name
        vegetableFamily
        isPickled
      }
    }
  }
`

const FruitsPage = () => {
  const { data, error, loading } = useQuery<GetGroceries>(GET_PRODUCE)
  return (
    <>
      <MetaTags title="Groceries" description="Groceries page" />

      <p>{!loading && !error && JSON.stringify(data)}</p>
    </>
  )
}

export default FruitsPage
