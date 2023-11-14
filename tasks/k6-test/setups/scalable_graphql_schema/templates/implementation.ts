import type { MutationResolvers, QueryResolvers } from 'types/graphql'

type DataItem = {
  id: number
  name: string
  email: string
  phone: string
  address: string
  verified: boolean
  tags: string[]

  typeName: string
}
const data: DataItem[] = __DATA__
const typeName = '__TYPE_NAME__'

export const __QUERY_NAME__s: QueryResolvers['__QUERY_NAME__s'] = () => {
  return data
}

export const __QUERY_NAME__: QueryResolvers['__QUERY_NAME__'] = ({ id }) => {
  return data.find((item) => item.id === id)
}

export const create__TYPE_NAME__: MutationResolvers['create__TYPE_NAME__'] = ({
  input,
}) => {
  const newItem = {
    id: data.length + 1,
    ...input,
    typeName,
  }
  data.push(newItem)
  return newItem
}

export const update__TYPE_NAME__: MutationResolvers['update__TYPE_NAME__'] = ({
  id,
  input,
}) => {
  const index = data.findIndex((item) => item.id === id)
  if (index !== -1) {
    data[index] = {
      ...data[index],
      ...input,
    }
  }
  return data[index]
}

export const delete__TYPE_NAME__: MutationResolvers['delete__TYPE_NAME__'] = ({
  id,
}) => {
  const index = data.findIndex((item) => item.id === id)
  return data.splice(index, 1)[0]
}

// export const Post: PostRelationResolvers = {
//   author: (_obj, { root }) => {
//     return db.post.findUnique({ where: { id: root?.id } }).author()
//   },
// }

export const __TYPE_NAME__: __TYPE_NAME__RelationResolvers = {
  relation: (_obj, { _root }) => {
    return {
      id: 1,
      name: 'relation',
    }
  },
}
