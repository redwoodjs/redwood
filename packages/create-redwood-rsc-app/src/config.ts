export interface Config {
  installationDir: string
  verbose: boolean
}

export function initConfig() {
  const config: Config = {
    installationDir: '',
    verbose: false,
  }

  console.log('process.argv:', process.argv)
  let args = {
    verbose: false,
    help: false,
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

  if (args.verbose) {
    console.log('Parsed command line arguments:')
    console.log('    arguments:', args)
    console.log('    installationDir:', installationDir)
  }

  config.verbose = !!args.verbose
  config.installationDir = installationDir ?? ''

  return config
}
