import type { QueryResolvers, MutationResolvers } from 'types/graphql'

import { db } from 'src/lib/db'

export const userExamples: QueryResolvers['userExamples'] = () => {
  return db.userExample.findMany()
}

export const userExample: QueryResolvers['userExample'] = ({ id }) => {
  return db.userExample.findUnique({
    where: { id },
  })
}

export const createUserExample: MutationResolvers['createUserExample'] = ({
  input,
}) => {
  return db.userExample.create({
    data: input,
  })
}

export const updateUserExample: MutationResolvers['updateUserExample'] = ({
  id,
  input,
}) => {
  return db.userExample.update({
    data: input,
    where: { id },
  })
}

export const deleteUserExample: MutationResolvers['deleteUserExample'] = ({
  id,
}) => {
  return db.userExample.delete({
    where: { id },
  })
}
