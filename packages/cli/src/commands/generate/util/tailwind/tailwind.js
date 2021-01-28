import { generateDepracatedHandler } from '../depracatedHandler'

// ********
// Deprecated as of September 2020
// Use "setup" command
// ********

export const command = 'auth'
export const description = 'WARNING: deprecated. Use "yarn rw setup" command.'

export const handler = generateDepracatedHandler({
  newCommand: 'yarn rw setup auth ${provider}',
  docsLink: 'https://redwoodjs.com/reference/command-line-interface#setup',
})
