import { EnvelopArmorPlugin } from '@escape.tech/graphql-armor'
import type { GraphQLArmorConfig } from '@escape.tech/graphql-armor/dist/declarations/src/config'
import type { GraphQLError, ValidationContext } from 'graphql'

import type { Logger } from '@redwoodjs/api/logger'

export const useGraphQLArmor = (
  logger: Logger,
  config?: GraphQLArmorConfig
) => {
  const logRejection = (ctx: ValidationContext | null, error: GraphQLError) => {
    if (ctx) {
      logger.info(`rejection context: ${ctx}`)
    }
    logger.error(`rejected request: ${error}`)
  }

  return EnvelopArmorPlugin({
    ...config,
    costLimit: {
      onReject: [logRejection],
    },
    maxAliases: {
      onReject: [logRejection],
    },
    maxDepth: {
      onReject: [logRejection],
    },
    maxDirectives: {
      onReject: [logRejection],
    },
    maxTokens: {
      onReject: [logRejection],
    },
  })
}
