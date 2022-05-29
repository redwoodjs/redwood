import { db } from 'src/lib/db'
import type { QueryResolvers } from 'types/graphql'

export const user: QueryResolvers["user"] = (
  {
    id
  }
) => {

    return db.user.findUnique({ where: { id }})

}
