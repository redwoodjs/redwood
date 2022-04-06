---
description: The serverless git deploy you know and love
---

# Deploy to Netlify

## Netlify tl;dr Deploy

If you simply want to experience the Netlify deployment process without a database and/or adding custom code, you can do the following:

1. create a new redwood project: `yarn create redwood-app ./netlify-deploy`
2. after your "netlify-deploy" project installation is complete, init git, commit, and add it as a new repo to GitHub, BitBucket, or GitLab
3. run the command `yarn rw setup deploy netlify` and commit and push changes
4. use the Netlify [Quick Start](https://app.netlify.com/signup) to deploy

## Netlify Complete Deploy Walkthrough

For the complete deployment process on Netlify, see the [Tutorial Deployment section](tutorial/chapter4/deployment.md).
