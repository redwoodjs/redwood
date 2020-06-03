import { UserWhereUniqueInput } from '@prisma/client'
import { ResolverArgs } from '@redwoodjs/api/dist/types'
import { db } from 'src/lib/db'

export const users = () => {
  return db.user.findMany()
}

export const User = {
  identity: (_obj, { root }: ResolverArgs<UserWhereUniqueInput>) =>
    db.user.findOne({ where: { id: root.id } }).identity(),
}
