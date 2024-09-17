import type { API, FileInfo } from 'jscodeshift'

const componentBlock = `{
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
}`

export default (file: FileInfo, api: API) => {
  const j = api.jscodeshift
  const root = j(file.source)

  // Replace
  // import { Link, routes } from '@redwoodjs/router'
  // with
  // import type { GetGroceries, GetProduce } from 'types/graphql'
  root
    .find(j.ImportDeclaration, {
      source: {
        type: 'StringLiteral',
        value: '@redwoodjs/router',
      },
    })
    .replaceWith(
      j.importDeclaration(
        [
          j.importSpecifier(j.identifier('GetGroceries')),
          j.importSpecifier(j.identifier('GetProduce')),
        ],
        j.stringLiteral('types/graphql'),
        'type',
      ),
    )

  // Replace
  // import { Metadata } from '@redwoodjs/web'
  // with
  // import { Metadata, useQuery } from '@redwoodjs/web'
  root
    .find(j.ImportDeclaration, {
      source: {
        type: 'StringLiteral',
        value: '@redwoodjs/web',
      },
    })
    .replaceWith((nodePath) => {
      const { node } = nodePath
      node.specifiers?.push(j.importSpecifier(j.identifier('useQuery')))
      return node
    })

  // Add
  // import FruitInfo from 'src/components/FruitInfo'
  // import ProduceInfo from 'src/components/ProduceInfo'
  // import VegetableInfo from 'src/components/VegetableInfo'
  // after
  // import { Metadata, useQuery } from '@redwoodjs/web'
  root
    .find(j.ImportDeclaration, {
      source: {
        type: 'StringLiteral',
        value: '@redwoodjs/web',
      },
    })
    .insertAfter(() => {
      return [
        j.importDeclaration(
          [j.importDefaultSpecifier(j.identifier('FruitInfo'))],
          j.stringLiteral('src/components/FruitInfo'),
        ),
        j.importDeclaration(
          [j.importDefaultSpecifier(j.identifier('ProduceInfo'))],
          j.stringLiteral('src/components/ProduceInfo'),
        ),
        j.importDeclaration(
          [j.importDefaultSpecifier(j.identifier('VegetableInfo'))],
          j.stringLiteral('src/components/VegetableInfo'),
        ),
      ]
    })

  // Add
  // const GET_GROCERIES = gql`
  //   query GetGroceries {
  //     groceries {
  //       ...Fruit_info
  //       ...Vegetable_info
  //     }
  //   }
  // `
  // After
  // import VegetableInfo from 'src/components/VegetableInfo'
  const query = `
  query GetGroceries {
    groceries {
      ...Fruit_info
      ...Vegetable_info
    }
  }
`
  root
    .find(j.ImportDeclaration, {
      source: {
        type: 'StringLiteral',
        value: 'src/components/VegetableInfo',
      },
    })
    .insertAfter(() => {
      return j.variableDeclaration('const', [
        j.variableDeclarator(
          j.identifier('GET_GROCERIES'),
          j.taggedTemplateExpression(
            j.identifier('gql'),
            j.templateLiteral(
              [j.templateElement({ raw: query, cooked: query }, true)],
              [],
            ),
          ),
        ),
      ])
    })

  // Add
  // const GET_PRODUCE = gql`
  //   query GetProduce {
  //     produces {
  //       ...Produce_info
  //     }
  //   }
  // `
  // After
  // const GET_GROCERIES = ...
  const produceQuery = `
  query GetProduce {
    produces {
      ...Produce_info
    }
  }
`
  root
    .find(j.VariableDeclaration, {
      kind: 'const',
      declarations: [
        {
          id: {
            type: 'Identifier',
            name: 'GET_GROCERIES',
          },
        },
      ],
    })
    .insertAfter(() => {
      return j.variableDeclaration('const', [
        j.variableDeclarator(
          j.identifier('GET_PRODUCE'),
          j.taggedTemplateExpression(
            j.identifier('gql'),
            j.templateLiteral(
              [
                j.templateElement(
                  { raw: produceQuery, cooked: produceQuery },
                  true,
                ),
              ],
              [],
            ),
          ),
        ),
      ])
    })

  // Replace entire body of GroceriesPage component
  root
    .find(j.VariableDeclarator, {
      id: {
        type: 'Identifier',
        name: 'GroceriesPage',
      },
    })
    .find(j.BlockStatement)
    .replaceWith(j.identifier(componentBlock))

  return root.toSource()
}
