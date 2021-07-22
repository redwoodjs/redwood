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
