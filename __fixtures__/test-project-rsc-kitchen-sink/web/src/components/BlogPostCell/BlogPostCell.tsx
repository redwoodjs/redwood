import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { CellSuccessProps, CellFailureProps } from '@redwoodjs/web'

export const data = async ({ slug }: { slug: string }) => {
  const blogPostPath = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
    '..',
    '..',
    '..',
    'api',
    'db',
    'blog',
    `${slug}.md`
  )

  const blogPost = await fs.promises.readFile(blogPostPath, 'utf-8')

  return { blogPost }
}

export const Loading = () => <div>Loading...</div>

export const Empty = () => <div>Empty</div>

export const Failure = ({ error }: CellFailureProps) => (
  <div style={{ color: 'red' }}>Error: {error?.message}</div>
)

type SuccessProps = CellSuccessProps<Awaited<ReturnType<typeof data>>>
export const Success = ({ blogPost }: SuccessProps) => {
  return (
    <div>
      <pre>{blogPost}</pre>
    </div>
  )
}
