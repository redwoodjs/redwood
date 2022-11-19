# Branch Strategy

Sometimes the changes introduced in a major version can't be fully vetted in a pull request.
When this happens, we use a dual branch strategy ("main" and "next") to enable work on the major (by committing breaking changes to main) while preserving our ability to release minors and patches.
This is a tradeoff that makes working on the major easier but releasing harder.
The tooling in this directory tries to mitigate that, taking advantage of the branch strategy's "one-way commit flow" (from main to next).

## Usage

> **Note**
>
> Always start on the `branch-strategy-triage` branch

## Reference

Preface all commands with `yarn branch-strategy`

| Command               | Description                                                                            |
| :-------------------- | :------------------------------------------------------------------------------------- |
| `triage-main`         | Triage commits from main to next                                                       |
| `triage-next`         | Triage commits from next to the release branch                                         |
| `find-pr`             | Find which branches a PR is in                                                         |
| `validate-milestones` | Validate PRs' milestone (i.e., that a PR milestoned v3.5.0 is in release/minor/v3.5.0) |
