import type { UseFragmentResult } from '@apollo/client'
import * as apolloClient from '@apollo/client'
import { createFragmentRegistry } from '@apollo/client/cache'
import { getFragmentDefinitions } from '@apollo/client/utilities'
import type { DocumentNode } from 'graphql'

const getTypenameFromFragment = (fragment: DocumentNode): string => {
  const [definition] = getFragmentDefinitions(fragment)
  return definition.typeCondition.name.value
}

const useRegisteredFragmentHook = <TData = any>(
  fragment: DocumentNode,
  id: string | number
) => {
  const from = { __typename: getTypenameFromFragment(fragment), id }

  return apolloClient.useFragment({
    fragment,
    from,
  }) as UseFragmentResult<TData>
}

export const fragmentRegistry = createFragmentRegistry()

export const registerFragments = (fragments: DocumentNode[]) => {
  return fragments.map(registerFragment)
}

export const registerFragment = (fragment: DocumentNode) => {
  fragmentRegistry.register(fragment)

  const typename = getTypenameFromFragment(fragment)

  const getCacheKey = (id: string | number) => {
    return { __typename: typename, id }
  }

  const useRegisteredFragment = <TData = any>(id: string | number) => {
    return useRegisteredFragmentHook<TData>(fragment, id)
  }

  return { fragment, typename, getCacheKey, useRegisteredFragment }
}
