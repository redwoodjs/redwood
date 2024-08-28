import type { GetGroceries, GetProduce } from "types/graphql";
import { Metadata, useQuery } from '@redwoodjs/web';

import FruitInfo from "src/components/FruitInfo";
import ProduceInfo from "src/components/ProduceInfo";
import VegetableInfo from "src/components/VegetableInfo";

const GET_GROCERIES = gql`
  query GetGroceries {
    groceries {
      ...Fruit_info
      ...Vegetable_info
    }
  }
`;

const GET_PRODUCE = gql`
  query GetProduce {
    produces {
      ...Produce_info
    }
  }
`;

const GroceriesPage = () => {
  const { data: groceryData, loading: groceryLoading } =
    useQuery<GetGroceries>(GET_GROCERIES)
  const { data: produceData, loading: produceLoading } =
    useQuery<GetProduce>(GET_PRODUCE)

  return (
    <div className="m-12">
      <Metadata title="Groceries" description="Groceries page" og />

      <div className="grid auto-cols-auto gap-4 grid-cols-4">
        {!groceryLoading &&
          groceryData.groceries.map((fruit) => (
            <FruitInfo key={fruit.id} id={fruit.id} />
          ))}

        {!groceryLoading &&
          groceryData.groceries.map((vegetable) => (
            <VegetableInfo key={vegetable.id} id={vegetable.id} />
          ))}

        {!produceLoading &&
          produceData.produces?.map((produce) => (
            <ProduceInfo key={produce.id} id={produce.id} />
          ))}
      </div>
    </div>
  )
}

export default GroceriesPage
