import chalk from 'chalk'

export const command = 'check'
export const aliases = ['diagnostics']
export const description =
  'Get structural diagnostics for a Redwood project (experimental)'

export const handler = async () => {
  // Generate a full project and list any errors and warnings
  const { RedwoodProject } = await import('@redwoodjs/skeleton')
  const project = RedwoodProject.getProject({
    full: true,
    readFromCache: false, // Don't read from the cache so we know the errors/warnings aren't stale
  })
  const hasErrors = project.hasErrors(true)
  if (hasErrors) {
    project.printErrors(true)
  }
  const hasWarnings = project.hasWarnings(true)
  if (hasWarnings) {
    project.printWarnings(true)
  }

  if (!(hasErrors || hasWarnings)) {
    console.log(
      chalk.bgGreen('[Success]'),
      'There were no warnings or errors detected'
    )
  }

  if (hasErrors) {
    process.exit(1)
  }
}
