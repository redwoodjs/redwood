import { EnvelopArmorPlugin } from '@escape.tech/graphql-armor'
import type { GraphQLError, ValidationContext } from 'graphql'

import type { Logger } from '@redwoodjs/api/logger'

import { ArmorConfig } from '../functions/types'

const armorConfigDefaultOptions: ArmorConfig = {
  logContext: false,
  logErrors: true,
}

export const useArmor = (logger: Logger, config?: ArmorConfig) => {
  const logRejection = (ctx: ValidationContext | null, error: GraphQLError) => {
    if (config?.logContext ?? armorConfigDefaultOptions.logContext) {
      if (ctx) {
        logger.debug({ custom: ctx }, `Armor rejection context`)
      }
    }

    if (config?.logErrors ?? armorConfigDefaultOptions.logErrors) {
      logger.error(error, `Armor rejected request: ${error.message}`)
    }
  }

  return EnvelopArmorPlugin({
    ...config,
    costLimit: {
      ...config?.costLimit,
      onReject: [logRejection],
    },
    maxAliases: {
      ...config?.maxAliases,
      onReject: [logRejection],
    },
    maxDepth: {
      ...config?.maxDepth,
      onReject: [logRejection],
    },
    maxDirectives: {
      ...config?.maxDirectives,
      onReject: [logRejection],
    },
    maxTokens: {
      ...config?.maxTokens,
      onReject: [logRejection],
    },
  })
}
