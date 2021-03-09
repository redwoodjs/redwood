import { generateDepracatedHandler } from '../generateDepracatedHandler'

// ********
// Deprecated as of September 2020
// Use "setup" command
// ********

export const command = 'deploy'
export const description = 'WARNING: deprecated. Use "yarn rw setup" command.'

export const handler = generateDepracatedHandler({
  newCommand: 'yarn rw setup deploy ${provider}',
  docsLink: 'https://redwoodjs.com/reference/command-line-interface#setup',
})
