import type { MutationResolvers } from 'types/graphql'

import { setContext } from '@redwoodjs/graphql-server'

import { logger } from 'src/lib/logger'

export const magicNumber: MutationResolvers['magicNumber'] = async ({
  value,
}) => {
  setContext({
    // ...context,
    magicNumber: value,
  })
  // context.magicNumber = value

  const sleep = Math.random() * 200
  // logger.info(`Sleeping for ${sleep}ms`)
  await new Promise((resolve) => setTimeout(resolve, sleep))

  const numberFromContext = (context.magicNumber ?? -1) as number
  if (value !== numberFromContext) {
    logger.error(`Expected ${value} but got ${numberFromContext}`)
    // throw new Error(`Expected ${value} but got ${numberFromContext}`)
  }

  return { value: numberFromContext }
}
