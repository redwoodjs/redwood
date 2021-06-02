import gql from 'graphql-tag'

import { getOperationType, getOperationName } from '../gql'

test('extracts type and name', () => {
  const QUERY = gql`
    query POSTS {
      posts {
        id
        title
        body
        createdAt
      }
    }
  `

  expect(getOperationType(QUERY)).toEqual('query')
  expect(getOperationName(QUERY)).toEqual('POSTS')
})
