import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { CellSuccessProps, CellFailureProps } from '@redwoodjs/web'

import { savePost } from 'src/lib/actions'

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
  let isInFrontmatter = false
  let hasExitedFrontmatter = false

  const { author, body } = blogPost.split('\n').reduce(
    (prev, curr) => {
      if (curr === '---' && !isInFrontmatter && !hasExitedFrontmatter) {
        isInFrontmatter = true
        return prev
      }

      if (isInFrontmatter && curr.startsWith('Author: ')) {
        return { ...prev, author: curr.replace('Author: ', '').trim() }
      }

      if (curr === '---' && isInFrontmatter) {
        isInFrontmatter = false
        hasExitedFrontmatter = true
        return prev
      }

      if (hasExitedFrontmatter) {
        return { ...prev, body: prev.body + curr + '\n' }
      }

      return prev
    },
    { author: '', body: '' }
  )

  return { slug, author, body: body.trim() }
}

export const Loading = () => <div>Loading...</div>

export const Empty = () => <div>Empty</div>

export const Failure = ({ error }: CellFailureProps) => (
  <div style={{ color: 'red' }}>Error: {error?.message}</div>
)

type SuccessProps = CellSuccessProps<Awaited<ReturnType<typeof data>>>
export const Success = ({ author, body }: SuccessProps) => {
  return (
    <div>
      <form action={savePost}>
        <label htmlFor="author">
          Author
          <input type="text" name="author" id="author" value={author} />
        </label>
        <label htmlFor="body">
          Body
          <textarea name="body" id="body">
            {body}
          </textarea>
        </label>
        <button type="submit">Save</button>
      </form>
    </div>
  )
}
