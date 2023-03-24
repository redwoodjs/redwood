---
description: Serverful deploys on GCP or AWS via Coherence's full-lifecycle environment automation
---

# Deploy to Coherence

[Coherence](https://www.withcoherence.com) delivers automated environments across the full software development lifecycle, without requiring you to glue together your own mess of open source tools to get a world-class develper experience for your team. Coherence is focused on serving startups, who are doing mission-critical work. With one simple configuration, Coherence offers:
- Cloud-hosted development environments, based on VSCode. Similar to gitpod or Github CodeSpaces
- Production-ready CI/CD running in your own GCP/AWS account, including: database migration/seeding/snapshot loading, parallelized tests, container building and docker registry management
- Full-stack branch previews. Vercel/netlify like developer experience for arbitrary container apps, including dependencies such as CDN, redis, and database resources
- Staging and production environment management in your AWS/GCP accounts. Production runs in its own cloud account (AWS) or project (GCP). Integrated secrets management across all environment types with a developer-friendly UI.

## Coherence Prerequisites
You have to have your project hosted on GitHub, and you must have an [AWS](https://docs.withcoherence.com/docs/tutorials/creating-an-app-on-aws) or [GCP](https://docs.withcoherence.com/docs/tutorials/creating-an-app-on-gcp) account.

## Coherence Deploy

If you want to deploy your redwood project on Coherence:
1. If you don't already have one, create a new redwood project: `yarn create redwood-app ./test-deploy`
3. run the command `yarn rw setup deploy coherence`. The command will inspect your `prisma` config to determine if you are using a supported database (`postgres` or `mysql` are supported on Coherence)
4. follow the [Coherence Redwood Deploy Docs](https://docs.withcoherence.com/docs/configuration/frameworks#redwood-js) for more information, including if you want to set up:
- redis server
- database migration/seeding/snapshot loading
- cron jobs or async workers
- object storage using Google Cloud Storage or AWS's S3
