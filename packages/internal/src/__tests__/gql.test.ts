import gql from 'graphql-tag'

import { parseDocumentAST } from '../gql'

test('parses a document AST', () => {
  const QUERY = gql`
    query POSTS {
      posts {
        id
        title
        body
        createdAt
      }
      numberOfPosts
    }
  `

  expect(parseDocumentAST(QUERY)).toMatchInlineSnapshot(`
    Array [
      Object {
        "fields": Array [
          Object {
            "posts": Array [
              "id",
              "title",
              "body",
              "createdAt",
            ],
          },
          "numberOfPosts",
        ],
        "name": "POSTS",
        "operation": "query",
      },
    ]
  `)
})

test('handles inline fragments', () => {
  const QUERY = gql`
    query MyCellQuery {
      something {
        ... on SomeType {
          __typename
        }
        ... on SomeOtherType {
          __typename
        }
      }
    }
  `

  expect(parseDocumentAST(QUERY)).toMatchInlineSnapshot(`
    Array [
      Object {
        "fields": Array [
          Object {
            "something": Array [
              "__typename",
              "__typename",
            ],
          },
        ],
        "name": "MyCellQuery",
        "operation": "query",
      },
    ]
  `)
})

test('handles fragments', () => {
  const QUERY = gql`
    fragment ABC on B {
      a
    }
    query MyCellQuery {
      something {
        ...ABC
      }
    }
  `

  expect(parseDocumentAST(QUERY)).toMatchInlineSnapshot(`
    Array [
      Object {
        "fields": Array [
          Object {
            "something": Array [],
          },
        ],
        "name": "MyCellQuery",
        "operation": "query",
      },
    ]
  `)
})
