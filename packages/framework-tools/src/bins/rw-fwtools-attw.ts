import { attw } from '../attw.js'

async function main() {
  const cwd = process.argv[2]
  if (!cwd) {
    console.error('Usage: rw-attw <path-to-package>')
    process.exit(1)
  }

  console.log(`Running attw against: ${cwd}`)

  const problems = await attw({ cwd })
  if (problems.length > 0) {
    console.error('Problems found:')
    for (const problem of problems) {
      console.error(problem)
    }
    process.exit(1)
  }

  console.log('No problems found')
  process.exit(0)
}

main()
