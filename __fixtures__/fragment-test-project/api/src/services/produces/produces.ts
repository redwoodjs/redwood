import type {
  QueryResolvers,
  MutationResolvers,
  ProduceRelationResolvers,
} from 'types/graphql'

import { db } from 'src/lib/db'

export const produces: QueryResolvers['produces'] = () => {
  return db.produce.findMany()
}

export const produce: QueryResolvers['produce'] = ({ id }) => {
  return db.produce.findUnique({
    where: { id },
  })
}

export const createProduce: MutationResolvers['createProduce'] = ({
  input,
}) => {
  return db.produce.create({
    data: input,
  })
}

export const updateProduce: MutationResolvers['updateProduce'] = ({
  id,
  input,
}) => {
  return db.produce.update({
    data: input,
    where: { id },
  })
}

export const deleteProduce: MutationResolvers['deleteProduce'] = ({ id }) => {
  return db.produce.delete({
    where: { id },
  })
}

export const Produce: ProduceRelationResolvers = {
  stall: (_obj, { root }) => {
    return db.produce.findUnique({ where: { id: root?.id } }).stall()
  },
}
