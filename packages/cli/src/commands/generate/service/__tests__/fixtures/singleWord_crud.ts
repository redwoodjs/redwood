import {
  PostWhereUniqueInput,
  PostCreateInput,
  PostUpdateInput,
} from '@prisma/client'
import { db } from 'src/lib/db'

export const posts = () => {
  return db.post.findMany()
}

export const post = ({ id }: PostWhereUniqueInput) => {
  return db.post.findOne({
    where: { id },
  })
}

interface CreatePostArgs {
  input: PostCreateInput
}

export const createPost = ({ input }: CreatePostArgs) => {
  return db.post.create({
    data: input,
  })
}

interface UpdatePostArgs {
  where: PostWhereUniqueInput
  input: PostUpdateInput
}

export const updatePost = ({ id, input }: UpdatePostArgs) => {
  return db.post.update({
    data: input,
    where: { id },
  })
}

export const deletePost = ({ id }: PostWhereUniqueInput) => {
  return db.post.delete({
    where: { id },
  })
}
