import gql from 'graphql-tag'
import { createValidatorDirective } from '@redwoodjs/graphql-server'

export const schema = gql`
  directive @skipAuth on FIELD_DEFINITION
`

export const skipAuth = createValidatorDirective(schema, () => {
  return
})
