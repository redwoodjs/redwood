export async function execute(args, command) {
  console.log('-'.repeat(80))
  console.log('Execute from exampleExe.js')
  console.dir(args, { depth: null })
  console.dir(command, { depth: null })
  console.log('-'.repeat(80))
}
