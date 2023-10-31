# Using Gitpod

## What is Gitpod?
Gitpod is a cloud development environment with all the necessary tools and dependencies, allowing you to focus on building your RedwoodJS application without worrying about the setup. Get started quickly and efficiently by launching RedwoodJS inside Gitpod!

## Getting Started
Click on the Open in Gitpod button:

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/redwoodjs/starter)

<!-- Video: How to get started with Gitpod to first commit -->

This will launch GitPod and ask you to configure a new workspace. Click continue.

![GitPod Onboarding Screen](https://github.com/redwoodjs/starter/raw/main/images/gitpod-new-workspace.png)

GitPod will then begin to build your workspace. This may take several minutes.

What's going on behind the scenes:

- GitPod is setting the workspace set up
- It installs our recommended VS Code plugins:
  - [ESLint](https://github.com/redwoodjs/starter/blob/main)
  - [Git Lens](https://github.com/redwoodjs/starter/blob/main)
  - [VS Code Language - Babel](https://github.com/redwoodjs/starter/blob/main)
  - [VS Code Version Lens](https://github.com/redwoodjs/starter#:~:text=VS%20Code%20Version%20Lens)
  - [Editor Config](https://github.com/redwoodjs/starter#:~:text=Code%20Version%20Lens-,Editor%20Config,-Prisma)
  - [Prisma](https://github.com/redwoodjs/starter/blob/main)
  - [VS Code GraphQL](https://github.com/redwoodjs/starter/blob/main)
- It runs our **Create Redwood App** which will install the latest stable version of Redwood. We're setting this project to use TypeScript, however, you can [change it to JavaScript](https://github.com/redwoodjs/starter/blob/main) if you prefer.
- It runs `yarn install`, adding all the dependencies for the project
Changes the database to a postgres database

Once everything is up and running, you can click on the Ports tab

[![GitPod Ports Tab](https://github.com/redwoodjs/starter/blob/main/images/gitpod-ports.png)]

You can click on the address or the globe icon to open that particular port in a new tab.

- Port 5432 is the database. So, if you click on that port, you'll probably see a "Port 5432 Not Found" error, but it is working!

![GitPod on Port 5432](https://github.com/redwoodjs/starter/raw/main/images/gitpod-port-5432.png)

- Port 8910 is your frontend
![Port 8910 frontend](https://github.com/redwoodjs/starter/raw/main/images/gitpod-port-8910.png)

- Port 8911 is your backend and will show you a list of all available functions. If you add /graphql to the end of the URL, you should see the GraphQL Playground

![Port 8911 GraphQL Playground](https://github.com/redwoodjs/starter/raw/main/images/gitpod-graphql.png)

## How to Use Gitpod

<!-- Video: Tour Gitpod / VS Code and Sync in 2 places -->
