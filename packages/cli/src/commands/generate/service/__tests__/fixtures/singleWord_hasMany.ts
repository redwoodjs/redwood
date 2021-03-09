import { Prisma } from '@prisma/client'
import { ResolverArgs } from '@redwoodjs/api/dist/types'
import { db } from 'src/lib/db'

export const users = () => {
  return db.user.findMany()
}

export const User = {
  userProfiles: (_obj, { root }: ResolverArgs<Prisma.UserWhereUniqueInput>) =>
    db.user.findUnique({ where: { id: root.id } }).userProfiles(),
}
