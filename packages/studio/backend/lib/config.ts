import { getConfig } from '@redwoodjs/project-config'

import type { ApiConfig, StudioConfig, WebConfig } from '../types'

export const getApiConfig = (): ApiConfig => {
  return getConfig().api
}

export const getWebConfig = (): WebConfig => {
  const web = getConfig().web
  const apiUrl = web.apiUrl

  // Construct the graphql url from apiUrl by default
  // But if apiGraphQLUrl is specified, use that instead
  const studioConfig = getStudioConfig()
  const graphql = studioConfig.graphiql?.endpoint ?? 'graphql'
  const graphqlEndpoint =
    web.apiGraphQLUrl ?? `http://${web.host}:${web.port}${apiUrl}/${graphql}`

  const webConfigWithGraphQlEndpoint = {
    ...getConfig().web,
    graphqlEndpoint,
  }

  return webConfigWithGraphQlEndpoint
}

export const getStudioConfig = (): StudioConfig => {
  return getConfig().experimental.studio
}
