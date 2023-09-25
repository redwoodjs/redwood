# GitHub action to create a RW project with RSCs set up

This action creates a RW project with Streaming SSR and RSCs set up. It's used
for RSC smoke tests.

It runs `npx -y create-redwood-app@canary ...` to set the project up with the
latest canary release of Redwood. It then runs
`experimental setup-streaming-ssr` and `experimental setup-rsc` followed by
a build of the rw app.

## Testing/running locally

Go into the github actions folder
`cd .github/actions`

Then run the "Locally" version of the setup script
`node set-up-rsc-project/setUpRscProjectLocally.mjs`
