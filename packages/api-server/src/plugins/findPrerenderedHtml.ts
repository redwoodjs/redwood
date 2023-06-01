import fg from 'fast-glob'

import { getPaths } from '@redwoodjs/project-config'

// NOTE: This function was copied from @redwoodjs/internal/dist/files to avoid depending on @redwoodjs/internal.
// import { findPrerenderedHtml } from '@redwoodjs/internal/dist/files'
export function findPrerenderedHtml(cwd = getPaths().web.dist) {
  return fg.sync('**/*.html', { cwd, ignore: ['200.html', '404.html'] })
}
