// These are normally auto-imported by babel
import React from 'react'

import gql from 'graphql-tag'
import { expectAssignable } from 'tsd-lite'

import type { CellProps, CellSuccessProps } from '@redwoodjs/web'

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

// This Cell takes a customProp i.e. one not provided by the Cell's query
interface SuccessProps extends CellSuccessProps<QueryResult> {
  customProp: number
}

const recipeCell = {
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
        <h1>Example Component</h1>
        <ul>
          <li>Recipe prop {props.recipes.length} </li>
          <li>Custom prop {props.customProp}</li>
        </ul>
      </>
    )
  },
}

describe('CellProps mapper type', () => {
  test('Inputs expect props outside cell, no beforeQuery', () => {
    type CellInputs = CellProps<
      typeof recipeCell.Success,
      QueryResult,
      typeof recipeCell,
      ExampleQueryVariables
    >

    expectAssignable<CellInputs>({
      customProp: 55,
      category: 'Dinner',
      saved: true,
    })
  })

  test('Inputs expect parameters defined in beforeQuery', () => {
    const cellWithBeforeQuery = {
      ...recipeCell,
      beforeQuery: ({ word }: { word: string }) => {
        return {
          variables: {
            category: word,
            saved: !!word,
          },
        }
      },
    }

    type CellWithBeforeQueryInputs = CellProps<
      typeof cellWithBeforeQuery.Success,
      QueryResult,
      typeof cellWithBeforeQuery,
      ExampleQueryVariables
    >

    // Note that the gql variables are no longer required here
    expectAssignable<CellWithBeforeQueryInputs>({
      word: 'abracadabra',
      customProp: 99,
    })
  })

  test('Inputs work as expected when no QueryVariables supplied', () => {
    type CellWithoutVariablesInputs = CellProps<
      typeof recipeCell.Success,
      QueryResult,
      typeof recipeCell,
      /*GQL Vars */ { [key: string]: never } // This is how graphql-codegen defines queries that don't take vars
    >

    // @MARK - this test is failing...
    // I think the never in gql vars is overriding the customProp
    expectAssignable<CellWithoutVariablesInputs>({
      customProp: 55,
    })
  })
})
