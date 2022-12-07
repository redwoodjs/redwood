// import { getPaths } from '../lib'
// import c from '../lib/colors'

export const command = 'check'
export const aliases = ['diagnostics']
export const description =
  'Get structural diagnostics for a Redwood project (experimental)'

export const handler = async () => {
  // Generate a full project and list all errors and warnings
  const { RedwoodProject } = await import('@redwoodjs/skeleton')
  const project = RedwoodProject.getProject({
    full: true,
    readFromCache: false, // Don't read from the cache so we know the errors/warnings aren't stale
  })
  project.printErrors(true)
  project.printWarnings(true)
  if (project.hasErrors(true)) {
    process.exit(1)
  }
}
