# GitHub action to copy a template RSC project to use for testing

This action copies a RW project with Streaming SSR and RSC support already set
up. It's used for RSC smoke tests.

It copies the `__fixtures__/test-project-rsc-external-packages-and-cells`
project, runs `yarn install` and `project:copy`. Finally it builds the rw app.

## Testing/running locally

Go into the github actions folder
`cd .github/actions/set-up-rsc-external-packages-and-cells-project`

Then run the following command to execute the action
`node setUpRscExternalPackagesProjectLocally.mjs`

## Design

The main logic of the action is in the `../actionsLib.mjs` file. To be able to
run that code both on GitHub and locally it uses dependency injection. The
injection is done by `setupRscExternalPackagesProjectLocally.mjs` for when you
want to run the action on your own machine and by
`setupRscExternalPackagesProjectGitHib.mjs` when it's triggered by GitHub CI.

When doing further changes to the code here it's very important to keep the
DI scripts as light on logic as possible. Ideally all logic is kept to
`../actionsLib.mjs` so that the same logic is used both locally and on GitHub.
Do note though that more actions share that code, so make sure not to break
the other actions when making changes there.
