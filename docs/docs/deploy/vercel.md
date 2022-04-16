---
description: Deploy serverless in an instant with Vercel
---

# Deploy to Vercel

### Vercel CLI

1. Install the [Vercel CLI](https://vercel.com/cli) and run `vercel` to deploy.
2. Vercel will detect that you are using Redwood and will enable the correct settings for your deployment.
3. Your application is deployed! (e.g. [redwood-template.vercel.app](https://redwood-template.vercel.app/))

```bash
npm i -g vercel
vercel init redwoodjs
```

### Vercel for Git

1. Push your code to your git repository (GitHub, GitLab, BitBucket).
2. [Import your Redwood project](https://vercel.com/new) into Vercel.
3. Optional: Add `DATABASE_URL` to the Environment Variables if you're [using a database](#3-prisma-and-database).
4. Vercel will detect that you are using Redwood and will enable the correct settings for your deployment.
5. Your application is deployed! (e.g. [redwood-template.vercel.app](https://redwood-template.vercel.app/))

After your project has been imported and deployed, all subsequent pushes to branches will generate [Preview Deployments](https://vercel.com/docs/concepts/deployments/environments#preview), and all changes made to the Production Branch (commonly “main”) will result in a [Production Deployment](https://vercel.com/docs/concepts/deployments/environments#production).

Learn more about Vercel’s [Git Integration](https://vercel.com/docs/concepts/git).
