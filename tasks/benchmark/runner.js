import { setup } from './setup'

// TODO: Make functions that
//  - Setup the project to a specific state
//  - Run a set of k6 benchmarks
//  - Evaluate the results
//  - Return the project to a clean state

async function serve() {
  // Runs k6
}

async function main() {
  await setup()

  await serve()
}
main()
