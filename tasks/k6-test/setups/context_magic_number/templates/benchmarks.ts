import type { MutationResolvers } from 'types/graphql'

import { setContext } from '@redwoodjs/context'

export const magicNumber: MutationResolvers['magicNumber'] = async ({
  value,
}) => {
  setContext({
    magicNumber: value,
  })

  const sleep = Math.random() * 200
  await new Promise((resolve) => setTimeout(resolve, sleep))

  const numberFromContext = (context.magicNumber ?? -1) as number
  if (value !== numberFromContext) {
    throw new Error(`Expected ${value} but got ${numberFromContext}`)
  }

  return { value: numberFromContext }
}
