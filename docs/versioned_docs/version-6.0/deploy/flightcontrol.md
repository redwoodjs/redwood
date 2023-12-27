---
description: How to deploy a Redwood app to AWS via Flightcontrol
---

# Deploy to AWS with Flightcontrol

[Flightcontrol](https://www.flightcontrol.dev?ref=redwood) enables any developer to deploy to AWS without being a wizard. It's extremely easy to use but lets you pop the hood and leverage the raw power of AWS when needed. It supports servers, static sites, and databases which makes it a perfect fit for hosting scalable Redwood apps.

## Flightcontrol Deploy Setup

1. In your project, run the command `yarn rw setup deploy flightcontrol --database=YOUR_DB_TYPE` where YOUR_DB_TYPE is `mysql` or `postgresql`
2. Commit the changes and push to github
3. If you don't have an account, sign up at [app.flightcontrol.dev/signup](https://app.flightcontrol.dev/signup?ref=redwood)
4. Create a new project from the onboarding screen or project list
  1. Connect your Github account and select your repo
  2. Select "Config Type" as `flightcontrol.json`
  3. Click "Create Project" and complete any required steps like linking your AWS account.
5. If using dbAuth, add the session secret key env variable in the Flightcontrol dashboard


NOTE: If you are using yarn v1, remove the `installCommand`'s from flightcontrol.json

If you have *any* problems or questions, Flightcontrol is very responsive in [their support Discord](https://discord.gg/yY8rSPrD6q).

