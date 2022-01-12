# Deploy

Redwood is designed for both serverless and traditional infrastructure deployments, offering a unique continuous deployment process in both cases:

1. code is committed to a repository on GitHub, GitLab, or Bitbucket, which triggers the deployment
2. the Redwood API Side and Web Side are individually prepared via a build process
3. during the build process, any database related actions are run (e.g. migrations)
4. the hosting provider deploys the built Web static assets to a CDN and the API code to a serverless backend (e.g. AWS Lambdas)

Currently, these are the officially supported deploy targets:
- [Netlify](https://www.netlify.com/)
- [Vercel](https://vercel.com)
- [AWS-Serverless](https://serverless.com)
- [Render](https://render.com)

Redwood has a CLI generator that adds the code and configuration required by the specified provider (see the [CLI Doc](https://redwoodjs.com/docs/cli-commands#deploy-config) for more information):
```shell
yarn rw setup deploy <provider>
```

There are examples of deploying Redwood on other providers such as Google Cloud and direct to AWS. You can find more information by searching the [GitHub Issues](https://github.com/redwoodjs/redwood/issues) and [Forums](https://community.redwoodjs.com).


## General Deployment Setup
Deploying Redwood requires setup for the following four categories.

### 1. Host Specific Configuration
Each hosting provider has different requirements for how (and where) the deployment is configured. Sometimes you'll need to add code to your repository, configure settings in a dashboard, or both. You'll need to read the provider specific documentation.

The most important Redwood configuration is to set the `apiUrl` in your `redwood.toml` This sets the API path for your serverless functions specific to your hosting provider.

### 2. Build Command
The build command is used to prepare the Web and API for deployment. Additionally, other actions can be run during build such as database migrations. The Redwood build command must specify one of the supported hosting providers (aka `target`):

```shell
yarn rw deploy <target>
```

For example:

```shell
# Build command for Netlify deploy target
yarn rw deploy netlify
```

```shell
# Build command for Vercel deploy target
yarn rw deploy vercel
```


```shell
# Build command for AWS Lambdas using the https://serverless.com framework
yarn rw deploy aws serverless --side api
```

### 3. Prisma and Database
Redwood uses Prisma for managing database access and migrations. The settings in `api/prisma/schema.prisma` must include the correct deployment database, e.g. postgresql, and the database connection string.

To use PostgreSQL in production, include this in your `schema.prisma`:

```javascript
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

The `url` setting above accesses the database connection string via an environment variable, `DATABASE_URL`. Using env vars is the recommended method for both ease of development process as well as security best practices.

Whenever you make changes to your `schema.prisma`, you must run the following command:
```shell	
$ yarn rw prisma migrate dev # creates and applies a new Prisma DB migration	
```

> Note: when setting your production DATABASE_URL env var, be sure to also set any connection-pooling or sslmode parameters. For example, if using Supabase Postgres with pooling, then you would use a connection string similar to `postgresql://postgres:mydb.supabase.co:6432/postgres?sslmode=require&pgbouncer=true` that uses a specific 6432 port, informs Prisma to consider pgBouncer, and also to use SSL. See: [Connection Pooling](https://redwoodjs.com/docs/connection-pooling) for more info.



### 4. Environment Variables
Any environment variables used locally, e.g. in your `env.defaults` or `.env`, must also be added to your hosting provider settings. (See documentation specific to your provider.)

Additionally, if your application uses env vars on the Web Side, you must configure Redwood's build process to make them available in production. See the [Redwood Environment Variables doc](https://redwoodjs.com/docs/environment-variables) for instructions.


## Netlify Deploy

### Netlify tl;dr Deploy
If you simply want to experience the Netlify deployment process without a database and/or adding custom code, you can do the following:
1. create a new redwood project: `yarn create redwood-app ./netlify-deploy`
2. after your "netlify-deploy" project installation is complete, init git, commit, and add it as a new repo to GitHub, BitBucket, or GitLab
3. run the command `yarn rw setup deploy netlify` and commit and push changes
4. use the Netlify [Quick Start](https://app.netlify.com/signup) to deploy

### Netlify Complete Deploy Walkthrough
For the complete deployment process on Netlify, see the [Tutorial Deployment section](https://redwoodjs.com/tutorial/deployment).

## Render Deploy
Render is a unified cloud to build and run all your apps and websites with free SSL, a global CDN, private networks and auto deploys from Git — **database included**!
### Render tl;dr Deploy
If you simply want to experience the Render deployment process, including a Postgres or SQLite database, you can do the following:
1. create a new redwood project: `yarn create redwood-app ./render-deploy`
2. after your "render-deploy" project installation is complete, init git, commit, and add it as a new repo to GitHub or GitLab 
3. run the command `yarn rw setup deploy render`, use the flag `--database` to select from `postgres`, `sqlite` or `none` to proceed without a database
4. follow the [Render Redwood Deploy Docs](https://render.com/docs/deploy-redwood) for detailed instructions

## Vercel Deploy
>The following instructions assume you have read the [General Deployment Setup](#general-deployment-setup) section above.

### Vercel tl;dr Deploy
If you simply want to experience the Vercel deployment process without a database and/or adding custom code, you can do the following:
1. create a new redwood project: `yarn create redwood-app ./vercel-deploy`
2. after your "vercel-deploy" project installation is complete, init git, commit, and add it as a new repo to GitHub, BitBucket, or GitLab
3. run the command `yarn rw setup deploy vercel` and commit and push changes
4. use the Vercel [Quick Start](https://vercel.com/#get-started) to deploy

_If you choose this quick deploy experience, the following steps do not apply._


### Redwood Project Setup
If you already have a Redwood project, proceed to the next step.

Otherwise, we recommend experiencing the full Redwood DX via the [Redwood Tutorial](https://redwoodjs.com/tutorial/welcome-to-redwood). Simply return to these instructions when you reach the "Deployment" section.

### Redwood Deploy Configuration

Complete the following two steps. Then save, commit, and push your changes.

#### Step 1. Serverless Functions Path
Run the following CLI Command:
```shell
yarn rw setup deploy vercel
```

This updates your `redwood.toml` file, setting `apiUrl = "/api"`:

#### Step 2. Database Settings
Follow the steps in the [Prisma and Database](#3-prisma-and-database) section above. _(Skip this step if your project does not require a database.)_

### Vercel Initial Setup and Configuration
Either [login](https://vercel.com/login) to your Vercel account and select "Import Project" or use the Vercel [quick start](https://vercel.com/#get-started).

Then select the "Continue" button within the "From Git Repository" section:
<img src="https://user-images.githubusercontent.com/2951/90482970-e6f3e700-e0e8-11ea-8b3e-979745b0a226.png" />

Next, select the provider where your repo is hosted: GitHub, GitLab, or Bitbucket. You'll be asked to login and then provider the URL of the repository, e.g. for a GitHub repo `https://github.com/your-account/your-project.git`. Select "Continue".

You'll then need to provide permissions for Vercel to access the repo on your hosting provider.

### Import and Deploy your Project
Vercel will recognize your repo as a Redwood project and take care of most configuration heavy lifting. You should see the following options and, most importantly, the "Framework Preset" showing RedwoodJS.

<img src="https://user-images.githubusercontent.com/2951/90486275-9337cc80-e0ed-11ea-9af3-fd9613c1256b.png" />

Leave the **Build and Output Settings** at the default settings (unless you know what you're doing and have very specific needs).

In the "Environment Variables" dropdown, add `DATABASE_URL` and your app's database connection string as the value. (Or skip if not applicable.)

> When configuring a database, you'll want to append `?connection_limit=1` to the URI. This is [recommended by Prisma](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/deployment#recommended-connection-limit) when working with relational databases in a Serverless context. For production apps, you should setup [connection pooling](https://redwoodjs.com/docs/connection-pooling).

For example, a postgres connection string should look like `postgres://<user>:<pass>@<url>/<db>?connection_limit=1`

Finally, click the "Deploy" button. You'll hopefully see a build log without errors (warnings are fine) and end up on a screen that looks like this:

<img src="https://user-images.githubusercontent.com/2951/90487627-9469f900-e0ef-11ea-9378-9bb85e02a792.png" />

Go ahead, click that "Visit" button. You’ve earned it 🎉

### Vercel Dashboard Settings
From the Vercel Dashboard you can access the full settings and information for your Redwood App. The default settings seem to work just fine for most Redwood projects. Do take a look around, but be sure check out the [docs as well](https://vercel.com/docs).

From now on, each time you push code to your git repo, Vercel will automatically trigger a deploy of the new code. You can also manually redeploy if you select "Deployments", then the specific deployment from the list, and finally the "Redeploy" option from the vertical dots menu next to "Visit".

## AWS Serverless Deploy
>The following instructions assume you have read the [General Deployment Setup](#general-deployment-setup) section above.

Deploying via AWS Serverless assumes that you have setup the [credentials](https://www.serverless.com/framework/docs/providers/aws/guide/credentials/) for the Serverless Framework on your computer. In order to setup your Redwood project to use AWS Serverless run: `yarn rw setup deploy aws-serverless`

Once that's complete you can invoke a deployment via: `yarn rw deploy aws`. This command will take care of building, packaging, and shipping your AWS Serverless functions.
