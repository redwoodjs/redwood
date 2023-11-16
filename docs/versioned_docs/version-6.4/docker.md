---
description: Redwood's Dockerfile
---

# Docker

:::note The Dockerfile is experimental

We've worked hard to optimize the Dockerfile and make the whole experience from setup to deploy smooth, but the Dockerfile still may change slightly as we make more optimizations and collaborate with more deploy providers.

:::

Redwood's Dockerfile is the accumulation of the hard work of several community members.
If you're not familiar with Docker, we recommend going through their [getting started](https://docs.docker.com/get-started/) documentation.

## Set up

To get started, run the setup command:

```
yarn rw experimental setup-docker
```

The setup commands does several things:
- writes four files: `Dockerfile`, `.dockerignore`, `docker-compose.dev.yml`, and `docker-compose.prod.yml`
- adds the official yarn [workspace-tools](https://v3.yarnpkg.com/features/plugins#official-plugins) plugin to configure yarn with the ability to only install production dependencies
- adds the `@redwoodjs/api-server` and `@redwoodjs/web-server` packages to the api and web sides respectively
- edits the `browser.open` setting in the `redwood.toml` (right now, if it's set to `true`, it'll break the dev server when running the `docker-compose.dev.yml`)

## Usage

You can start the dev compose file with:

```
docker compose -f ./docker-compose.dev.yml up
```

And the prod compose file with:

```
docker compose -f ./docker-compose.prod.yml up
```

:::info make sure to specify env vars

If your api side or web side depend on env vars at build time, you may need to supply them as `--build-args`, or in the compose files.

:::

The first time you do this, you'll have to use the console stage to go in and migrate the database—just like you would with a Redwood app on your machine:

```
docker compose -f ./docker-compose.dev.yml run --rm -it console /bin/bash
root@...:/home/node/app# yarn rw prisma migrate dev
```

## The Dockerfile in detail

The documentation here goes through and explains every line of Redwood's Dockerfile.
If you'd like to see the whole Dockerfile for reference, you can find it [here](https://github.com/redwoodjs/redwood/tree/main/packages/cli/src/commands/experimental/templates/docker/Dockerfile).
Or by setting it up in your project: `yarn rw experimental setup-docker`.

Redwood takes advantage of [Docker's multi-stage build support](https://docs.docker.com/build/building/multi-stage/) to keep the final production image lean.

### The `base` stage

The `base` stage installs dependencies.
It's used as the base image for the build stages and the `console` stage.

```Dockerfile
FROM node:18-bookworm-slim as base
```

We use a Node.js 18 image as the base image because that's what Redwood targets.
"bookworm" is the codename for the current stable distribution of Debian (version 12).
We think it's important to pin the version of the OS just like we pin the version of Node.js.
Lastly, the "slim" variant of the `node:18-bookworm` image only includes what Node.js needs which reduces the image's size while making it more secure.

:::tip Why not alpine?

While alpine may be smaller, it uses an unofficial C runtime.
In developing this Dockerfile, we prioritized security over size.

If you know what you're doing feel free to change this—it's your Dockerfile now! But you'll also probably have to change the apt-get instructions below.

:::


```Dockerfile
RUN apt-get update && apt-get install -y \
    openssl \
    && rm -rf /var/lib/apt/lists/*
```

The `node:18-bookworm-slim` image doesn't have [OpenSSL](https://www.openssl.org/), which [seems to be a bug](https://github.com/nodejs/docker-node/issues/1919).
(It was included in the bullseye image, the codename for Debian 11.)
When running on Linux distributions, [Prisma needs OpenSSL](https://www.prisma.io/docs/reference/system-requirements#linux-runtime-dependencies).
After installing it, we clean up the apt cache, adhering to [Docker best practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/#apt-get).

[It's recommended](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/#apt-get) to combine `apt-get update` and `apt-get install -y` in the same `RUN` statement for cache busting.

```Dockerfile
USER node
```

This and subsequent `chown` options in `COPY` instructions are for security.
[Services that can run without privileges should](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/#user).
The Node.js image includes a user, created with an explicit `uid` and `gid`, node; we reuse it.

```Dockerfile
WORKDIR /home/node/app

COPY --chown=node:node .yarn/plugins .yarn/plugins
COPY --chown=node:node .yarn/releases .yarn/releases
COPY --chown=node:node .yarnrc.yml .
COPY --chown=node:node package.json .
COPY --chown=node:node api/package.json api/
COPY --chown=node:node web/package.json web/
COPY --chown=node:node yarn.lock .
```

Here we copy the minimum set of files that the `yarn install` step needs.
The order isn't completely arbitrary—it tries to maximize [Docker's layer caching](https://docs.docker.com/build/cache/).
We expect `yarn.lock` to change more than the package.json files, the package.json files to change more than `.yarnrc.yml` , and `.yarnrc.yml` to change more than the binary, etc.
That said, it's hard to argue that these files couldn't be arranged differently, or tht the COPY instructions couldn't be combined.
The important thing is that they're all here, before the `yarn install` step:

```Dockerfile
RUN --mount=type=cache,target=/home/node/.yarn/berry/cache,uid=1000 \
    --mount=type=cache,target=/home/node/.cache,uid=1000 \
    CI=1 yarn install
```

The `yarn install` step.
This step installs all your project's dependencies—production and dev.
Since we use multi-stage builds, your production images won't pay for the dev dependencies installed in this step.
The build stages need the dev dependnecies.

This step is a bit more involved than the others.
It uses a [cache mount](https://docs.docker.com/build/cache/#use-your-package-manager-wisely).
Yarn operates in three steps: resolution, fetch, and link.
If you're not careful, the cache for the fetch step basically doubles the number of `node_modules` installed on disk.
We could disable it all together, but by using a cache mount, we can still get the benefits without paying twice.
We set it to the default directory here, but you can change its location in `.yarnrc.yml`.
If you've done so you'll have to change it here too.

The last thing to note is that we designate the node user.
[The node user's `uid` is `1000`](https://github.com/nodejs/docker-node/blob/57d57436d1cb175e5f7c8d501df5893556c886c2/18/bookworm-slim/Dockerfile#L3-L4).

One more thing to note: without setting `CI=1`, depending on the deploy provider, yarn may think it's in a TTY, making the logs difficult to read. With this set, yarn adapts accordingly.
Enabling CI enables `--immutable --inline-builds`, both of which are highly recommended. For more information on those settings:

- https://yarnpkg.com/configuration/yarnrc#enableInlineBuilds
- https://yarnpkg.com/configuration/yarnrc#enableProgressBars
- https://yarnpkg.com/configuration/yarnrc#enableTelemetry

```Dockerfile
COPY --chown=node:node redwood.toml .
COPY --chown=node:node graphql.config.js .
COPY --chown=node:node .env.defaults .env.defaults
```

We'll need these config files for the build and production stages.
The `redwood.toml` file is Redwood's de-facto config file.
Both the build and serve stages pull from it to enable and configure functionality.

.env.defaults is ok to include. Because this file is committed to git.
But .env is not. If you add a secret to the Dockerfile, it can be excavated.
While it's technically true that multi stage builds add a sort of security layer, it's not a best practice.
Leave them out and figure it out with your deploy provider.

### The `api_build` stage

The `api_build` builds the api side.

```Dockerfile
FROM base as api_build

# If your api side build relies on build-time environment variables,
# specify them here as ARGs.
#
# ARG MY_BUILD_TIME_ENV_VAR

COPY --chown=node:node api api
RUN yarn redwood build api
```

After the work we did in the base stage, building the api side amounts to copying in the api directory and running yarn redwood build api.

Remember not to put secrets here.

### The `api_serve` stage

The `api_serve` stage serves your GraphQL api and functions.

```Dockerfile
FROM node:18-bookworm-slim as api_serve

RUN apt-get update && apt-get install -y \
    openssl \
    && rm -rf /var/lib/apt/lists/*
```

We don't start from the base stage, but begin anew with the `node:18-bookworm-slim` image.
Since this is a production stage, it's important for it to be as small as possible.
Docker's [multi-stage builds](https://docs.docker.com/build/building/multi-stage/) enables this.

```Dockerfile
USER node
WORKDIR /home/node/app

COPY --chown=node:node .yarn/plugins .yarn/plugins
COPY --chown=node:node .yarn/releases .yarn/releases
COPY --chown=node:node .yarnrc.yml .yarnrc.yml
COPY --chown=node:node api/package.json .
COPY --chown=node:node yarn.lock yarn.lock
```

The thing that's easy to miss here is that we're copying the `api/package.json` file into the base directory, so that it's just `package.json` in the image.
This is for the production `yarn install` in the next step.

Like other `COPY` instructions, ordering these files with care enables layering caching.

```Dockerfile
RUN --mount=type=cache,target=/home/node/.yarn/berry/cache,uid=1000 \
    --mount=type=cache,target=/home/node/.cache,uid=1000 \
    CI=1 yarn workspaces focus api --production
```

This is a critical step for image size.
We don't use the regular `yarn install` command.
Using the [official workspaces plugin](https://github.com/yarnpkg/berry/tree/master/packages/plugin-workspace-tools)—which will be included by default in yarn v4—we "focus" on the api workspace, only installing its production dependencies.

The cache mount will be populated at this point from the install in the `base` stage, so the fetch step in the yarn install should fly by.

```Dockerfile
COPY --chown=node:node redwood.toml .
COPY --chown=node:node graphql.config.js .
COPY --chown=node:node .env.defaults .env.defaults

COPY --chown=node:node --from=api_build /home/node/app/api/dist /home/node/app/api/dist
COPY --chown=node:node --from=api_build /home/node/app/api/db /home/node/app/api/db
COPY --chown=node:node --from=api_build /home/node/app/node_modules/.prisma /home/node/app/node_modules/.prisma
```

Here's where we really take advantage multi-stage builds by copying from the `api_build` stage.
All the building has been done for us—now we can just grab the artifacts without having to lug aronud the dev dependencies.

There's one more thing that was built—the prisma client in `node_modules/.prisma`.
We need to grab it too.

```Dockerfile
ENV NODE_ENV=production

CMD [ "node_modules/.bin/rw-server", "api", "--load-env-files" ]
```

Lastly, the default command is to start the api server using the bin from the `@redwoodjs/api-server` package.
You can override this command if you have more specific needs.

Note that the Redwood CLI isn't available anymore.
To access the server bin, we have to find it's path in node_modules.
Though this is somewhat discouraged in modern yarn, since we're using the `node_modules` linker, it's in `node_modules/.bin`.

### The `web_build` stage

This `web_build` builds the web side.

```Dockerfile
FROM base as web_build

COPY --chown=node:node web web
RUN node_modules/.bin/redwood build web --no-prerender
```

After the work we did in the base stage, building the web side amounts to copying in the web directory and running `yarn redwood build web`.

This stage is a bit of a simplification.
It foregoes Redwood's prerendering (SSG) capability.
Prerendering is a little trickier; see [the `web_prerender_build` stage](#the-web_prerender_build-stage).

If you've included environment variables in your `redwood.toml`'s `web.includeEnvironmentVariables` field, you'll want to specify them as ARGs here.
The setup command should've inlined them for you.

### The `web_prerender_build` stage

The `web_prerender_build` stage builds the web side with prerender.

```Dockerfile
FROM api_build as web_build_with_prerender

COPY --chown=node:node web web
RUN yarn redwood build web
```

Building the web side with prerendering poses a challenge.
Prerender needs the api side around to get data for your Cells and route hooks.
The key line here is the first one—this stage uses the `api_build` stage as its base image.

### The `web_serve` stage

```Dockerfile
FROM node:18-bookworm-slim as web_serve

USER node
WORKDIR /home/node/app

COPY --chown=node:node .yarn/plugins .yarn/plugins
COPY --chown=node:node .yarn/releases .yarn/releases
COPY --chown=node:node .yarnrc.yml .
COPY --chown=node:node web/package.json .
COPY --chown=node:node yarn.lock .

RUN --mount=type=cache,target=/home/node/.yarn/berry/cache,uid=1000 \
    --mount=type=cache,target=/home/node/.cache,uid=1000 \
    CI=1 yarn workspaces focus web --production

COPY --chown=node:node redwood.toml .
COPY --chown=node:node graphql.config.js .
COPY --chown=node:node .env.defaults .env.defaults

COPY --chown=node:node --from=web_build /home/node/app/web/dist /home/node/app/web/dist

ENV NODE_ENV=production \
    API_HOST=http://api:8911

CMD "node_modules/.bin/rw-web-server" "--apiHost" "$API_HOST"
```

Most of this stage is similar to the `api_serve` stage, except that we're copying from the `web_build` stage instead of the `api_build`.
(If you're prerendering, you'll want to change the `--from=web_build` to `--from=web_prerender_build`.)

The binary we're using here to serve the web side is `rw-web-server` which comes from the `@redwoodjs/web-server` package.
While this web server will be much more fully featured in the future, right now it's mostly just to get you going.
Ideally you want to put a web server like Nginx or Caddy in front of it.

Lastly, note that we use the shell form of `CMD` here for its variable expansion.

### The `console` stage

The `console` stage is an optional stage for debugging.

```Dockerfile
FROM base as console

# To add more packages:
#
# ```
# USER root
#
# RUN apt-get update && apt-get install -y \
#     curl
#
# USER node
# ```

COPY --chown=node:node api api
COPY --chown=node:node web web
COPY --chown=node:node scripts scripts
```

The console stage completes the base stage by copying in the rest of your Redwood app.
But then it pretty much leaves you to your own devices.
The intended way to use it is to create an ephemeral container by starting a shell like `/bin/bash` in the image built by targeting this stage:

```bash
# Build the console image:
docker build . -t console --target console
# Start an ephemeral container from it:
docker run --rm -it console /bin/bash
```

As the comment says, feel free to add more packages.
We intentionally kept them to a minimum in the base stage, but you shouldn't worry about the size of the image here.
