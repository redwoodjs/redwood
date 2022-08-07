import type { QueryResolvers, UserResolvers } from 'types/graphql'

import { db } from 'src/lib/db'

export {}

export const user: QueryResolvers['user'] = ({ id }) => {
  return db.user.findUnique({
    where: { id },
  })
}

export const User: Partial<UserResolvers> = {
  posts: (_obj, gqlArgs) =>
    db.user.findUnique({ where: { id: gqlArgs?.root?.id } }).posts(),
}
