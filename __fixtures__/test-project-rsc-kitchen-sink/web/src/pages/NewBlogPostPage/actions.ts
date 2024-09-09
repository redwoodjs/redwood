import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export function savePost(formData: FormData) {
  'use server'

  console.log('formData', ...formData)

  const postBody: string = formData.get('body').toString()

  const slug =
    postBody
      .split('\n')
      .find((line) => line.startsWith('# '))
      ?.slice(2)
      ?.toLowerCase()
      ?.trim()
      ?.replace(/\s+/g, '-')
      ?.replace(/[^-\w]/g, '') || 'untitled-post-' + new Date().getTime()

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

  const post =
    '---\n' +
    'Date: ' +
    new Date().toISOString().slice(0, 10) +
    '\n' +
    'Author: ' +
    formData.get('author') +
    '\n' +
    '---\n\n' +
    postBody

  fs.writeFileSync(blogPostPath, post, 'utf-8')
}
