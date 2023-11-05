# Smoke tests

These smoke tests run against the test project fixture (./\_\_fixtures\_\_/test-project).
They're a critical part of Redwood's CI.

## Running a smoke test

First, you'll need a test project to run smoke tests against:

```
yarn build:test-project --link <test project path>
```

Then, set the `REDWOOD_TEST_PROJECT_PATH` env var to the path of your test project:

```
REDWOOD_TEST_PROJECT_PATH=<test project path>
```

Redwood has a mini CLI for running the smoke tests:

```
yarn smoke-tests [options] [smoke-test..]
```

If you don't specify any smoke tests to run, it'll prompt you:

Smoke tests are written using [Playwright](https://playwright.dev/).
You can pass options to the underlying Playwright test command (`npx playwright test`) using `--playwrightOptions`.
Some common ones are `--debug` (to step through the test) and `--headed` (to see what's happening):

```
yarn smoke-tests --playwrightOptions="--debug"
yarn smoke-tests --playwrightOptions="--headed"
```

See `yarn smoke-tests --help` for more.

If you want to skip the CLI all together, you can `cd` into the directory of the smoke test you want to run and run `npx playwright test` directly:

```
cd ./tasks/smoke-tests/dev
npx playwright test
```

### Gotchas

There's a few gotchas to be aware of:

- not all smoke tests are idempotent. this means you may need to...
  - reset the test project's database (`yarn rw prisma migreate reset --force`) between runs
  - remove files that were written or undo file changes. (for this reason, you may find it helpful to initialize a git repo in the test project before running smoke tests)

- `yarn rwfw project:sync` needs to be running in the test project to test framework changes
  - if you created the test project with `--link`, it should already be running. if not, just run it in the test project

- some smoke tests, like prerender or serve, need the test project to be built (`yarn rw build`)

The CLI tries to warn you about all of these (but the first; that'll have to be fixed by refactoring the tests).

## Adding a smoke test category

To add a smoke tests category, add a directory with the name of the smoke test category here.
Then, add a `playwright.config.ts` file to that directory that extends from the [base playwright config](./basePlaywright.config.js).
Extend or override the config as necessary:

```ts
import { defineConfig } from '@playwright/test'

  // 👇 Import the base config.
import { basePlaywrightConfig } from '../basePlaywright.config'

export default defineConfig({
  // 👇 And spread it here.
  ...basePlaywrightConfig,

  // 👇 Add or override whatever you like.
  timeout: 30_000 * 2,

  // 👇 Change the web server config as you need.
  webServer: {
    command: 'yarn redwood dev --no-generate --fwd="--no-open"',
    cwd: process.env.REDWOOD_TEST_PROJECT_PATH,
    // We wait for the api server to be ready instead of the web server
    // because web starts much faster with Vite.
    url: 'http://localhost:8911/graphql?query={redwood{version}}',
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
  },
})
```

Add your tests (`*.spec.ts` files) to a `tests` directory. Before any writing custom logic, consider if what you need is already in [./shared](./shared).
Be sure to familiarize yourself with the [Playwright docs](https://playwright.dev/docs/intro).

Once you're done, you'll probably want your smoke tests to run in CI.
To add your smoke test to CI, add a step to [ci.yml](../../.github/workflows/ci.yml), replacing `<category>` with the name of your smoke test category:

```yml
      - name: Run <category> smoke tests
        working-directory: ./tasks/smoke-tests/<category>
        run: npx playwright test
        env:
          REDWOOD_TEST_PROJECT_PATH: '${{ steps.set-up-test-project.outputs.test-project-path }}'
          REDWOOD_DISABLE_TELEMETRY: 1
```
