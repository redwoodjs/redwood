import {
  UserProfileWhereUniqueInput,
  UserProfileCreateInput,
  UserProfileUpdateInput,
} from '@prisma/client'
import { db } from 'src/lib/db'

export const userProfiles = () => {
  return db.userProfile.findMany()
}

export const userProfile = ({ id }: UserProfileWhereUniqueInput) => {
  return db.userProfile.findOne({
    where: { id },
  })
}

interface CreateUserProfileArgs {
  input: UserProfileCreateInput
}

export const createUserProfile = ({ input }: CreateUserProfileArgs) => {
  return db.userProfile.create({
    data: input,
  })
}

interface UpdateUserProfileArgs {
  where: UserProfileWhereUniqueInput
  input: UserProfileUpdateInput
}

export const updateUserProfile = ({ id, input }: UpdateUserProfileArgs) => {
  return db.userProfile.update({
    data: input,
    where: { id },
  })
}

export const deleteUserProfile = ({ id }: UserProfileWhereUniqueInput) => {
  return db.userProfile.delete({
    where: { id },
  })
}
