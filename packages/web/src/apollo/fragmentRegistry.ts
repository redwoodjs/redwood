import * as apolloClient from '@apollo/client'
import type { UseFragmentResult } from '@apollo/client'
import type { FragmentRegistryAPI } from '@apollo/client/cache'
import { createFragmentRegistry } from '@apollo/client/cache'
import { getFragmentDefinitions } from '@apollo/client/utilities'
import type { DocumentNode } from 'graphql'

export type FragmentIdentifier = string | number

export type CacheKey = {
  __typename: string
  id: FragmentIdentifier
}

export type RegisterFragmentResult = {
  fragment: DocumentNode
  typename: string
  getCacheKey: (id: FragmentIdentifier) => CacheKey
  useRegisteredFragment: <TData = any>(
    id: FragmentIdentifier
  ) => UseFragmentResult<TData>
}

const getTypenameFromFragment = (fragment: DocumentNode): string => {
  const [definition] = getFragmentDefinitions(fragment)
  return definition.typeCondition.name.value
}

const useRegisteredFragmentHook = <TData = any>(
  fragment: DocumentNode,
  id: string | number
): UseFragmentResult<TData> => {
  const from = { __typename: getTypenameFromFragment(fragment), id }

  return apolloClient.useFragment({
    fragment,
    from,
  })
}

export const fragmentRegistry: FragmentRegistryAPI = createFragmentRegistry()

export const registerFragments = (fragments: DocumentNode[]) => {
  return fragments.map(registerFragment)
}

export const registerFragment = (
  fragment: DocumentNode
): RegisterFragmentResult => {
  fragmentRegistry.register(fragment)

  const typename = getTypenameFromFragment(fragment)

  const getCacheKey = (id: FragmentIdentifier): CacheKey => {
    return { __typename: typename, id }
  }

  const useRegisteredFragment = <TData = any>(
    id: FragmentIdentifier
  ): UseFragmentResult<TData> => {
    return useRegisteredFragmentHook<TData>(fragment, id)
  }

  return { fragment, typename, getCacheKey, useRegisteredFragment }
}
