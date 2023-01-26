// These are normally auto-imported by babel
import React from 'react'

import gql from 'graphql-tag'
import { expectAssignable, expectType } from 'tsd-lite'

import type { CellProps, CellSuccessProps } from '../components/createCell'

type ExampleQueryVariables = {
  category: string
  saved: boolean
}

// Just an example model returned from the query
type Recipe = {
  __typename?: 'Recipe'
  id: string
  name: string
}

// This is the type returned by querying
// e.g. query ListRecipes { recipes { id name } }
type QueryResult = {
  __typename?: 'Query'
  recipes: Array<Recipe>
}

interface SuccessProps extends CellSuccessProps<QueryResult> {
  customProp: number
}

const ExampleCell = {
  QUERY: gql`
    query ListRecipes {
      recipes {
        id
        name
      }
    }
  `,
  Loading: () => null,
  Empty: () => null,
  Failure: () => null,
  Success: (props: SuccessProps) => {
    return (
      <>
        Example Component {props.recipes} {props.otherProp}
      </>
    )
  },
  beforeQuery: () => {},
}

type CellInputs = CellProps<
  typeof ExampleCell.Success,
  QueryResult,
  typeof ExampleCell,
  ExampleQueryVariables
>

describe('CellProps mapper type', () => {
  test('Inputs expect props outside cell', () => {
    expectAssignable<CellInputs>({
      customProp: 55,
    })
  })
})
