import type { Prisma } from '@prisma/client'

import { db } from 'src/lib/db'

export const posts = () => {
  return db.post.findMany()
}

export const post = ({ id }: Prisma.PostWhereUniqueInput) => {
  return db.post.findUnique({
    where: { id },
  })
}

interface CreatePostArgs {
  input: Prisma.PostCreateInput
}

export const createPost = ({ input }: CreatePostArgs) => {
  return db.post.create({
    data: input,
  })
}

interface UpdatePostArgs extends Prisma.PostWhereUniqueInput {
  input: Prisma.PostUpdateInput
}

export const updatePost = ({ id, input }: UpdatePostArgs) => {
  return db.post.update({
    data: input,
    where: { id },
  })
}

export const deletePost = ({ id }: Prisma.PostWhereUniqueInput) => {
  return db.post.delete({
    where: { id },
  })
}
