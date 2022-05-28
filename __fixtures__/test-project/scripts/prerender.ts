import { db } from '$api/src/lib/db'

export default async function pathParameterValues() {
  return {
    blogPost: (await db.post.findMany()).map((post) => ({ id: post.id })),
  }
}
