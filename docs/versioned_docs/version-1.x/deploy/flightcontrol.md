---
description: Bring DX to your AWS account
---

# Deploy to Flightcontrol

[Flightcontrol](https://www.flightcontrol.dev?ref=redwood) is a new platform that brings world-class deployment DX natively to your AWS account. It's easy to use but lets you pop the hood and leverage the raw power of AWS when needed. It currently supports servers, static sites, and databases which makes it a perfect fit for hosting scalable Redwood apps.

## Flightcontrol Deploy Setup

1. In your project, run the command `yarn rw setup deploy flightcontrol`
2. Commit the changes and push to github
3. If you don't have an account, sign up at [app.flightcontrol.dev/signup](https://app.flightcontrol.dev/signup?ref=redwood)
4. Create a new project at [app.flightcontrol.dev/projects/new/1](https://app.flightcontrol.dev/projects/new/1)
  1. Connect your Github account and select your repo
  2. Select "Config Type" as `flightcontrol.json`
  3. Select the AWS region to deploy to.
  4. Click "Create Project" and complete any required steps like linking your AWS account.


NOTE: If you are using yarn v1, remove the `installCommand`'s from flightcontrol.json

If you have *any* problems or questions, Flightcontrol is very responsive in [their support Discord](https://discord.gg/yY8rSPrD6q).

