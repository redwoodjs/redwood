import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { Link } from '@redwoodjs/router/Link'
import { namedRoutes as routes } from '@redwoodjs/router/namedRoutes'
import type { CellSuccessProps, CellFailureProps } from '@redwoodjs/web'

type BlogPost = {
  slug: string
  title: string
}

export const data = async () => {
  const blogDir = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
    '..',
    '..',
    '..',
    'api',
    'db',
    'blog'
  )

  const fileNames = await fs.promises.readdir(blogDir)

  const blogPosts: BlogPost[] = []

  for (const fileName of fileNames) {
    const slug = fileName.replace(/\.md$/, '')
    console.log('slug:', slug)
    const postContent = await fs.promises.readFile(
      path.join(blogDir, fileName),
      'utf-8'
    )

    const title = postContent
      .split('\n')
      .find((line) => line.startsWith('# '))
      ?.replace('# ', '')

    blogPosts.push({ slug, title: title || 'Untitled' })
  }

  // DX: Can we return a single value instead of an object?
  return { blogPosts }
}

export const Loading = () => <div>Loading blog posts...</div>

export const Empty = () => <div>No posts yet</div>

export const Failure = ({ error }: CellFailureProps) => (
  <div className="rw-cell-error">{error?.message}</div>
)

type SuccessProps = CellSuccessProps<Awaited<ReturnType<typeof data>>>
export const Success = ({ blogPosts }: SuccessProps) => {
  return (
    <ul>
      {blogPosts.map((post) => (
        <li key={post.slug}>
          <Link to={routes.blogPost({ slug: post.slug })}>{post.title}</Link>
        </li>
      ))}
    </ul>
  )
}
