# GitHub action to create a RW project with RSCs set up

This action creates a RW project with Streaming SSR and RSC support set up.
It's used for RSC smoke tests.

It runs `npx -y create-redwood-app@canary ...` to set the project up with the
latest canary release of Redwood. It then runs
`experimental setup-streaming-ssr` and `experimental setup-rsc` followed by
a build of the rw app. Finally it runs `project:copy` to get the latest
changes to the framework (i.e. the changes introduced by the PR triggering this
action) into the project.

## Testing/running locally

Go into the github actions folder
`cd .github/actions`

Then run the following command to execute the action
`node set-up-rsc-project/setUpRscProjectLocally.mjs`

## Design

The main logic of the action is in the `setUpRscProject.mjs` file. To be able
to run that code both on GitHub and locally it uses dependency injection. The
injection is done by `setupRscProjectLocally.mjs` for when you want to run
the action on your own machine and by `setupRscProjectGitHib.mjs` when it's
triggered by GitHub CI.

When doing further changes to the code here it's very important to keep the
DI scripts as light on logic as possible. Ideally all logic is kept to
`setUpRscProject.mjs` so that the same logic is used both locally and on
GitHub.
