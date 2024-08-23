# E2E Background jobs

This script runs an E2E style test against the Redwood Jobs feature. Testing that jobs can be setup, generated, scheduled and executed.

## Usage

You can run this locally by creating a test project:

```bash
yarn build:test-project ../rw-test-project
```

Then you can execute the script like so:

```bash
yarn e2e:background-jobs ../rw-test-project
```

You will likely find it helpful to set up git in the test project so you can easily rollback the project to the default state if you need to rerun the test multiple times.
