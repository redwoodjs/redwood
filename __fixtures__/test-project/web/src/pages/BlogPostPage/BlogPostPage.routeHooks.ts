import { db } from '$api/src/lib/db'

export async function routeParameters() {
  return (await db.post.findMany()).map((post) => ({ id: post.id }))
}
