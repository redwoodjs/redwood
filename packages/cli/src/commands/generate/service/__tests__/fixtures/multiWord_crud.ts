import { Prisma } from '@prisma/client'
import { db } from 'src/lib/db'
import { requireAuth } from 'src/lib/auth'

export const beforeResolver = (rules) => {
  rules.apply(requireAuth)
}

export const userProfiles = () => {
  return db.userProfile.findMany()
}

export const userProfile = ({ id }: Prisma.UserProfileWhereUniqueInput) => {
  return db.userProfile.findUnique({
    where: { id },
  })
}

interface CreateUserProfileArgs {
  input: Prisma.UserProfileCreateInput
}

export const createUserProfile = ({ input }: CreateUserProfileArgs) => {
  return db.userProfile.create({
    data: input,
  })
}

interface UpdateUserProfileArgs {
  where: Prisma.UserProfileWhereUniqueInput
  input: Prisma.UserProfileUpdateInput
}

export const updateUserProfile = ({ id, input }: UpdateUserProfileArgs) => {
  return db.userProfile.update({
    data: input,
    where: { id },
  })
}

export const deleteUserProfile = ({ id }: Prisma.UserProfileWhereUniqueInput) => {
  return db.userProfile.delete({
    where: { id },
  })
}
