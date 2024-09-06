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

export function deletePost(formData: FormData) {
  'use server'

  const slug = formData.get('slug').toString()

  // Always validate user input!
  if (!/[-\w]/.test(slug)) {
    console.error('Invalid slug', slug)
    // TODO (RSC): It'd be nice if we could do something like this:
    // Could also be a way to do redirects!
    // return new Response('Invalid slug', { status: 400 })
    return
  }

  const blogPostPath = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
    '..',
    '..',
    '..',
    'api',
    'db',
    'blog',
    `${formData.get('slug')}.md`
  )

  console.log('deleting post', blogPostPath)
  fs.unlinkSync(blogPostPath)
}
