# Smoke tests

These smoke tests run against the test project fixture at [../../\_\_fixtures\_\_/test-project](../../__fixtures__/test-project).
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

If you don't specify any smoke tests to run, it'll prompt you.

Smoke tests are written using [Playwright](https://playwright.dev/).
You can pass options to the underlying Playwright test command (`npx playwright test`) using `--playwrightOptions`.
Some common ones are `--debug` (to step through a test), `--headed` (to see what's happening), and `--ui` (to run tests in an interactive UI):

```
yarn smoke-tests --playwrightOptions="--debug"
yarn smoke-tests --playwrightOptions="--headed"
yarn smoke-tests --playwrightOptions="--ui"
```

See `yarn smoke-tests --help` for more.

If you want to skip the CLI all together, you can `cd` into the directory of the smoke test you want to run and run `npx playwright test` directly:

```
cd ./tasks/smoke-tests/dev
npx playwright test
```

Just remember to set `REDWOOD_TEST_PROJECT_PATH` and have `yarn rwfw project:sync` running in your test project if you want to test against framework changes.

### Gotchas

There's a few gotchas to be aware of:

- Not all smoke tests are idempotent

  This means you may need to reset the test project's database (`yarn rw prisma migrate reset --force`) between runs or remove files that were written or undo file changes. (For this reason, you may find it helpful to initialize a git repo in the test project before running smoke tests.)

- `yarn rwfw project:sync` needs to be running in the test project to test framework changes

  If you created the test project with `--link`, it should already be running. If not, just run it in the test project.

- Some smoke tests, like prerender or serve, need the test project to be built (`yarn rw build`)

The CLI tries to warn you about all of these (except the first; that'll have to be fixed by refactoring the tests).
