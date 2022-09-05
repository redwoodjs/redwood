/* eslint-env es6, node */
import assert from 'node:assert'

import { exec, getExecOutput } from '@actions/exec'

// ------------------------
// --cwd
// ------------------------

console.log('[TEST] Lets the user set the cwd via the `--cwd` option\n')
await exec(
  'node ./packages/cli/dist/index.js --cwd ./__fixtures__/test-project --version'
)

// This should throw.
try {
  console.log(
    `\n[TEST] Throws if set via --cwd and there's no "redwood.toml"\n`
  )
  await exec('node ./packages/cli/dist/index.js --cwd ./__fixtures__ --version')
  process.exit(1)
  // eslint-disable-next-line no-empty
} catch {}

// ------------------------
// RWJS_CWD
// ------------------------

console.log('\n[TEST] Lets the user set the cwd via RWJS_CWD\n')
await exec('node ./packages/cli/dist/index.js --version', null, {
  env: {
    RWJS_CWD: './__fixtures__/test-project',
  },
})

// This should throw.
try {
  console.log(
    `\n[TEST] Throws if set via RWJS_CWD and there's no "redwood.toml"\n`
  )
  await exec('node ./packages/cli/dist/index.js --version', null, {
    env: {
      RWJS_CWD: './__fixtures__',
    },
  })
  process.exit(1)
  // eslint-disable-next-line no-empty
} catch {}

// ------------------------
// --cwd and RWJS_CWD
// ------------------------

console.log('\n[TEST] Prefers --cwd to RWJS_CWD\n')
await exec(
  'node ./packages/cli/dist/index.js --cwd ./__fixtures__/test-project --version',
  null,
  {
    env: {
      RWJS_CWD: '/ignored/path',
    },
  }
)

// ------------------------
// find up
// ------------------------

console.log(
  "\n[TEST] Finds up for a redwood.toml if --cwd and RWJS_CWD aren't set\n"
)
await exec(`node ../../../packages/cli/dist/index.js --version`, null, {
  cwd: './__fixtures__/test-project/api',
})

// This should throw.
try {
  console.log("\n[TEST] Throws if it can't find up for a redwood.toml\n")
  await exec(`node ../packages/cli/dist/index.js --version`, null, {
    cwd: './__fixtures__',
  })
  process.exit(1)
  // eslint-disable-next-line no-empty
} catch {}

// ------------------------
// dotenv-defaults
// ------------------------

console.log('\n[TEST] env')
const { stdout } = await getExecOutput(
  'node ./packages/cli/dist/index.js --cwd ./__fixtures__/test-project --test-env',
  null,
  {
    silent: true,
  }
)

const envs = stdout
  .split('\n')
  .filter(Boolean)
  .map((envs) => JSON.parse(envs))
  .reduce(
    (acc, env) => ({
      ...acc,
      [env.name]: env.value,
    }),
    {}
  )

assert(envs['process.env before dotenv-defaults'].DATABASE_URL === undefined)
assert(
  envs['process.env after dotenv-defaults'].DATABASE_URL === 'file:./dev.db'
)
