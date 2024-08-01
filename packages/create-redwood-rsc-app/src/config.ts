import { ExitCodeError } from './error.js'

export interface Config {
  installationDir: string
  template: string
  verbose: boolean
}

export function initConfig() {
  const config: Config = {
    installationDir: '',
    template: '',
    verbose: false,
  }

  const args = {
    help: false,
    template: '',
    verbose: false,
    version: false,
  }

  // Skipping the first two arguments, which are the path to the node executable
  // and the path to the script being executed, we find the first argument that
  // does not start with a dash. This is the installation directory.
  const installationDir = process.argv
    .slice(2)
    .find((arg) => !arg.startsWith('-'))

  if (process.argv.includes('--verbose') || process.argv.includes('-v')) {
    args.verbose = true
  }

  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    args.help = true
  }

  if (process.argv.includes('--version') || process.argv.includes('-V')) {
    args.version = true
  }

  const templateIndex = process.argv.findIndex(
    (arg) => arg.startsWith('--template') || arg.startsWith('-t'),
  )
  if (templateIndex >= 0) {
    if (process.argv[templateIndex].includes('=')) {
      args.template = process.argv[templateIndex].split('=')[1]
    } else if (
      process.argv[templateIndex + 1] &&
      !process.argv[templateIndex + 1].startsWith('-')
    ) {
      args.template = process.argv[templateIndex + 1]
    } else {
      throw new ExitCodeError(
        1,
        'Error: No template provided after --template flag',
      )
    }
  }

  if (args.verbose) {
    console.log('process.argv', process.argv)
    console.log('Parsed command line arguments:')
    console.log('    arguments:', args)
    console.log('    installationDir:', installationDir)
  }

  config.verbose = !!args.verbose
  config.installationDir = installationDir ?? ''
  config.template = args.template || 'test-project-rsc-kitchen-sink'

  return config
}
