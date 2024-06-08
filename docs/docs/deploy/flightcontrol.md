---
description: How to deploy a Redwood app to AWS via Flightcontrol
---

# Deploy to AWS with Flightcontrol

[Flightcontrol](https://www.flightcontrol.dev?ref=redwood) enables any developer to deploy to AWS without being a wizard. It's extremely easy to use but lets you pop the hood and leverage the raw power of AWS when needed. It supports servers, static sites, and databases which makes it a perfect fit for hosting scalable Redwood apps.

## Flightcontrol Deploy Setup

1. In your project, run the command `yarn rw setup deploy flightcontrol --database=YOUR_DB_TYPE` where YOUR_DB_TYPE is `mysql` or `postgresql`
2. NOTE: The RedwoodJS Flightcontrol setup defaults to an environment\[0] of 'Development', add to the array to deploy more environments.
3. Commit the changes and push to github.
4. If you don't have an account, sign up at [app.flightcontrol.dev/signup](https://app.flightcontrol.dev/signup?ref=redwood).
5. Create a new project from the onboarding screen or project list.
    1. Connect your Github account and select your repo.
    2. Click "Create Project" and complete any required steps like linking your AWS account.
    3. Configuration Type should autoselect as `flightcontrol.json`.
    4. NOTE: `flightcontrol.json` is now the source of truth for your Project and its Environments.
6. Add your env vars in Flightcontrol for your Environment.
7. If using dbAuth, add the session secret key env variable in the Flightcontrol dashboard.

If you have *any* problems or questions, Flightcontrol is very responsive in [their support Discord](https://discord.gg/yY8rSPrD6q).
