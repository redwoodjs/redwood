import gql from 'graphql-tag'

export const SKIP_AUTH_SDL = /* GraphQL */ `
  directive @skipAuth on FIELD_DEFINITION
`

export const schema = gql`
  ${SKIP_AUTH_SDL}
`

// onExecute
export const skipAuth = () => {
  return
}
