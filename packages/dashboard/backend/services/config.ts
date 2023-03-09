import type { ApiConfig, DashboardConfig, WebConfig } from 'backend/types'

import { getConfig } from '@redwoodjs/internal'

export const apiConfig = async (_parent: unknown): Promise<ApiConfig> => {
  return getConfig().api
}

export const webConfig = async (_parent: unknown): Promise<WebConfig> => {
  const web = getConfig().web
  const apiUrl = web.apiUrl

  // Construct the graphql url from apiUrl by default
  // But if apiGraphQLUrl is specified, use that instead
  const graphqlEndpoint =
    web.apiGraphQLUrl ?? `http://${web.host}:${web.port}${apiUrl}/graphql`

  const webConfigWithGraphQlEndpoint = {
    ...getConfig().web,
    graphqlEndpoint,
  }

  return webConfigWithGraphQlEndpoint
}

export const dashboardConfig = async (
  _parent: unknown
): Promise<DashboardConfig> => {
  return getConfig().dashboard
}
