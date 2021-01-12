import { db } from 'src/lib/db'

export const userProfiles = () => {
  return db.userProfile.findMany()
}

export const userProfile = ({ id }) => {
  return db.userProfile.findUnique({
    where: { id },
  })
}

export const createUserProfile = ({ input }) => {
  return db.userProfile.create({
    data: input,
  })
}

export const updateUserProfile = ({ id, input }) => {
  return db.userProfile.update({
    data: input,
    where: { id },
  })
}

export const deleteUserProfile = ({ id }) => {
  return db.userProfile.delete({
    where: { id },
  })
}
