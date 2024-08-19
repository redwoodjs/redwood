import process from 'node:process'

import { attw, AttwMode } from '../attw.js'

async function main() {
  // Extract the mode from the command line argument
  const mode = process.argv[2]?.toLowerCase() as AttwMode | undefined
  if (!mode || !Object.values(AttwMode).includes(mode)) {
    console.error('Usage: rw-fwtools-attw <mode = all|bundler|node16>')
    process.exit(1)
  }

  console.log(`Running attw (${mode.toString()}) against: ${process.cwd()}`)

  const { ignored, failed } = await attw({
    mode: mode,
  })
  console.log(`Ignored: ${ignored.length}`)

  if (failed.length > 0) {
    console.error('Failures found:')
    for (const problem of failed) {
      console.error(problem)
    }
    process.exit(1)
  }

  console.log('No failures found')
  process.exit(0)
}

main()
