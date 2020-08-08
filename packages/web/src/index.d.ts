/* eslint-disable no-redeclare,  no-undef */
import type _React from 'react'
import type _gql from 'graphql-tag'
import type _PropTypes from 'prop-types'
import type {
  useSubscription as _useSubscription,
  useLazyQuery as _useLazyQuery,
  useQuery as _useQuery,
  useMutation as _useMutation,
  useApolloClient as _useApolloClient,
} from '@apollo/react-hooks'

declare global {
  // We reduce the number of imports that a user has to do by making them
  // globals via `Webpack.ProvidePlugin`
  const React: typeof _React
  const gql: typeof _gql
  const PropTypes: typeof _PropTypes
}

declare module '@redwoodjs/web' {
  const useQuery: typeof _useQuery
  const useMutation: typeof _useMutation
  const useLazyQuery: typeof _useLazyQuery

  const useSubscription: typeof _useSubscription
  const useApolloClient: typeof _useApolloClient

  type messages = {
    id: number // id
    text: string // default string
    classes: string // css classes
    persist: boolean // true will persist the message through each cycle until it is dismissed manually
    viewed: boolean // once true, the message will be dismissed on the next cycle
  }
  const useFlash: () => {
    messages: messages[]
    addMessage: (
      text: string, // default string
      options?: {
        text?: string // overwrites the text param passed to addMessage()
        classes?: string // css classes
        persist?: boolean // true will persist the message through each cycle until it is dismissed manually
        viewed?: boolean // once true, the message will be dismissed on the next cycle
      }
    ) => void
    dismissMessage: (messageId: number) => void
    cycleMessage: (messageId: number) => void
  }

  type ContextProps = {
    messages: messages[]
  }

  type FlashProps = {
    timeout: number // number in ms
  }
  const Flash: _React.FC<FlashProps>

  const FlashProvider: any
  const GraphQLProvider: any
  const createGraphQLClient: any

  // TODO: RedwoodProvider
}
