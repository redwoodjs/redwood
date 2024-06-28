import type {
  QueryResolvers,
  MutationResolvers,
  StallRelationResolvers,
} from 'types/graphql'

import { db } from 'src/lib/db'

export const stalls: QueryResolvers['stalls'] = () => {
  return db.stall.findMany()
}

export const stall: QueryResolvers['stall'] = ({ id }) => {
  return db.stall.findUnique({
    where: { id },
  })
}

export const createStall: MutationResolvers['createStall'] = ({ input }) => {
  return db.stall.create({
    data: input,
  })
}

export const updateStall: MutationResolvers['updateStall'] = ({
  id,
  input,
}) => {
  return db.stall.update({
    data: input,
    where: { id },
  })
}

export const deleteStall: MutationResolvers['deleteStall'] = ({ id }) => {
  return db.stall.delete({
    where: { id },
  })
}

export const Stall: StallRelationResolvers = {
  produce: (_obj, { root }) => {
    return db.stall.findUnique({ where: { id: root?.id } }).produce()
  },
}
