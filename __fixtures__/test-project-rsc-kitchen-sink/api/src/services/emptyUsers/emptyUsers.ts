import type { QueryResolvers, MutationResolvers } from 'types/graphql'

import { db } from 'src/lib/db'

export const emptyUsers: QueryResolvers['emptyUsers'] = () => {
  return db.emptyUser.findMany()
}

export const emptyUser: QueryResolvers['emptyUser'] = ({ id }) => {
  return db.emptyUser.findUnique({
    where: { id },
  })
}

export const createEmptyUser: MutationResolvers['createEmptyUser'] = ({
  input,
}) => {
  return db.emptyUser.create({
    data: input,
  })
}

export const updateEmptyUser: MutationResolvers['updateEmptyUser'] = ({
  id,
  input,
}) => {
  return db.emptyUser.update({
    data: input,
    where: { id },
  })
}

export const deleteEmptyUser: MutationResolvers['deleteEmptyUser'] = ({
  id,
}) => {
  return db.emptyUser.delete({
    where: { id },
  })
}
