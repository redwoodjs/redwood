# CHANGELOG

- feature: Enable [CSS nesting](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_nesting/Using_CSS_nesting) syntax by default when using Tailwind:
  
  ```
  .button {
    @apply p-2 font-semibold bg-gray-500;
    &:hover {
      @apply bg-red-500;
    }
    .icon {
      @apply w-4 h-4;
    }
    span {
      @apply text-sm;
    }
  }
  ```

## Unreleased
- fix(api-server): Preserve original host header for proxied API requests
Some apps rely on reading the host header(eg multi-tenant apps served over multiple subdomains).  This change forwards on the original host header on proxied Fastify requests, and the experimental SSR/RSC server

- fix(context): Re-export context from graphql-server (#10117)

  This change re-exports the `context` and `setContext` properties in
  `@redwoodjs/graphql-server` from the `@redwoodjs/context` package
  where they are now (as of v7) located. This is done to retroactively 
  ease the v7 transition and provide a non-breaking rather than a breaking
  change.

  See [this forum post](https://community.redwoodjs.com/t/context-imported-from-graphql-server-broken-post-7-0-0/5833)
  and the links within for more information on this change.

- fix(scenario): Make sure to clean up scenarios even if tests fail (#10112)
  Fixes an issue where a unit test failure would cause the scenario cleanup to be skipped. Thanks @peraltafederico  and @cjreimer for highlighting this!
  
- fix(serve): Allow periods in most paths (#10114)

  Partial fix for route paths with periods in them.

  It's only "partial" because it doesn't fix it for `yarn rw dev`, as that's a
  Vite bug
  ([vitejs/vite#2415 (comment)](https://github.com/vitejs/vite/issues/2415#issuecomment-1720814355)).
  And there's also an edge case for yarn rw serve where this doesn't fully
  handle client-side routes that start with /assets/ and that also have a
  last-segment that accepts a period, like /assets/client-route-image.jpg
  
  Fixes #9969

- fix(deps): update prisma monorepo to v5.10.2 (#10088)

  This release updates Prisma to v5.10.2. Here are quick links to all the release notes since the last version (v5.9.1):

  - https://github.com/prisma/prisma/releases/tag/5.10.0
  - https://github.com/prisma/prisma/releases/tag/5.10.1
  - https://github.com/prisma/prisma/releases/tag/5.10.2

- fix(esm): fix initial ESM blockers for Redwood apps (#10083) by @jtoar and @Josh-Walker-GM

  This PR makes some initial fixes that were required for making a Redwood app ESM. Redwood apps aren't ready to transition to ESM yet, but we're working towards it and these changes were backwards-compatible.
  If you're interested in trying out ESM, there will be an experimental setup command in the future. For now you'd have to make manual changes to your project:

    - dist imports, like `import ... from '@redwoodjs/api/logger'` need to be changed to `import ... from '@redwoodjs/api/logger/index.js'`
    - The Redwood Vite plugin in `web/vite.config.ts` needs to be changed to `redwood.default` before being invoked

  There are probably many others still depending on your project. Again, we don't recommend actually doing this yet, but are enumerating things just to be transparent about the changes in this release.
  
- fix(deploy): handle server file (#10061)

  This fixes the CLI commands for Coherence and Flightcontrol. For Coherence, it fixes a bug introduced in the last patch where the logic for detecting the server file in the setup command (`yarn rw setup deploy coherence`) was flipped. For Flightcontrol, it updates the setup command (`yarn rw setup deploy flightcontrol`) so that it handles Corepack and updates the corresponding deploy command (`yarn rw deploy flightcontrol`) so that it detects the server file similar to the Coherence fix.

- chore(docs): Add link to SuperTokens auth (#10067)

  Add a missing link to the SuperTokens auth page in the docs. @danbtl

- fix(coherence): update setup command to detect server file

  The `yarn rw setup deploy coherence` command now detects if your project has the server file and configures the api prod command accordingly:

  ```yml
  # coherence.yml

  api:
    # ...
    prod:
      command: ["yarn", "rw", "build", "api", "&&", "yarn", "node", "api/dist/server.js", "--apiRootPath=/api"]
  ```

- Update jsdoc for ScenarioData type (#29166)

  Fix formatting of JSDocs in `scenario.ts`

- fix(render): reduce memory and handle server file

  This PR improves Render deploys by reducing memory consumption and fixing it so that it uses the server file if it's present.

  Render deploys seems to consistently run out of memory during the data migration step. This step is configurable and its doubtful that every deploy has data migrations to apply, but it's enabled by default so it runs every time. The main issue is that the data migrate functionality is a plugin so a yarn install kicks off in Render's deploy container which must be more memory-constrained than the build container. (Assuming there are two different containers, which seems to be the case.)

  Instead of running data migrations, this PR issues a warning that if you want to run data migrations, you need to first add the `@redwoodjs/cli-data-migrate` package as a devDependency:

  ```
  yarn add -D @redwoodjs/cli-data-migrate
  ```

  That way a `yarn install` won't be necessary to run data migrations.

  Although this PR fixes Render deploy so that it uses the server file if present, realtime features still don't seem to work. We're still investigating; in the meantime, consider using another provider like Coherence if you're just getting started and want to try out realtime features.

- Update MetaTags to be Metadata in Docs (#10053)

  The tutorial still used the `MetaTags` component instead of the newer `Metadata` component that the generator templates use. This PR updates all instances of `MetaTags` with `Metadata`.

- fix(sentry): move templates to the command's directory

  Fix for https://community.redwoodjs.com/t/redwood-v7-0-0-upgrade-guide/5713/25. The template files for the sentry setup command weren't moved out of experimental (follow up to https://github.com/redwoodjs/redwood/pull/9830).

## v7.0.0

- See https://github.com/redwoodjs/redwood/releases/tag/v7.0.0 for the release notes and https://community.redwoodjs.com/t/redwood-v7-0-0-upgrade-guide/5713 for the upgrade guide

- fix(deps): update opentelemetry-js monorepo (#10065)

  Updates our opentelemetry packages. This is a breaking change for users of
  our experimental opentelemetry support. This is what their changelog says is
  breaking:

  * fix(exporter-metrics-otlp-grpc): programmatic headers take precedence over
    environment variables #2370 @Vunovati
  * fix(exporter-metrics-otlp-http): programmatic headers take precedence over
    environment variables #2370 @Vunovati
  * fix(exporter-metrics-otlp-proto): programmatic headers take precedence over
    environment variables #2370 @Vunovati
  * fix(otlp-exporter-base)!: decrease default concurrency limit to 30 #4211
    @pichlermarc
    * fixes a memory leak on prolonged collector unavailability
    * this change is marked as breaking as it changes defaults
  * fix(instrumentation)!: pin import-in-the-middle@1.7.1 #4441
    * Fixes a bug where, in some circumstances, ESM instrumentation packages
      would try to instrument CJS exports on ESM, causing the end-user
      application to crash.
    * This breaking change only affects users that are using the experimental
      @opentelemetry/instrumentation/hook.mjs loader hook AND Node.js 18.19 or
      later:
      * This reverts back to an older version of import-in-the-middle due to
        DataDog/import-in-the-middle#57
      * This version does not support Node.js 18.19 or later

- Add support for loading more env var files (#9961, #10093, and #10094)

  Fixes #9877. This PR adds CLI functionality to load more `.env` files via `NODE_ENV` and an `--load-env-files` flag.
  Env vars loaded via either of these methods override the values in `.env`:

  ```
  # Loads '.env.production', which overrides values in '.env'
  NODE_ENV=production yarn rw exec myScript

  # Load '.env.stripe' and '.env.nakama', which overrides values
  yarn rw exec myScript --load-env-files stripe nakama
  # Or you can specify them individually:
  yarn rw exec myScript --load-env-files stripe --load-env-files nakama
  ```

  Note that this feature is mainly for local scripting. Most deploy providers don't let you upload `.env` files (unless you're using baremetal) and usually have their own way of determining environments.

- fix(render): reduce memory and handle server file

  This PR improves Render deploys by reducing memory consumption and fixing it so that it uses the server file if it's present.

  Render deploys seems to consistently run out of memory during the data migration step. This step is configurable and its doubtful that every deploy has data migrations to apply, but it's enabled by default so it runs every time. The main issue is that the data migrate functionality is a plugin so a yarn install kicks off in Render's deploy container which must be more memory-constrained than the build container. (Assuming there are two different containers, which seems to be the case.)

  Instead of running data migrations, this PR issues a warning that if you want to run data migrations, you need to first add the `@redwoodjs/cli-data-migrate` package as a devDependency:

  ```
  yarn add -D @redwoodjs/cli-data-migrate
  ```

  That way a `yarn install` won't be necessary to run data migrations.

  Although this PR fixes Render deploy so that it uses the server file if present, realtime features still don't seem to work. We're still investigating; in the meantime, consider using another provider like Coherence if you're just getting started and want to try out realtime features.

- Update MetaTags to be Metadata in Docs (#10053)

  The tutorial still used the `MetaTags` component instead of the newer `Metadata` component that the generator templates use. This PR updates all instances of `MetaTags` with `Metadata`.

## v7.0.2

- See https://github.com/redwoodjs/redwood/releases/tag/v7.0.2

## v7.0.1

- See https://github.com/redwoodjs/redwood/releases/tag/v7.0.1

## v7.0.0

- See https://github.com/redwoodjs/redwood/releases/tag/v7.0.0 for the release notes and https://community.redwoodjs.com/t/redwood-v7-0-0-upgrade-guide/5713 for the upgrade guide

## v6.6.4

- See https://github.com/redwoodjs/redwood/releases/tag/v6.6.4

## v6.6.3

- See https://github.com/redwoodjs/redwood/releases/tag/v6.6.3

## v6.6.2

- See https://github.com/redwoodjs/redwood/releases/tag/v6.6.2

## v6.6.1

- See https://github.com/redwoodjs/redwood/releases/tag/v6.6.1

## v6.6.0

- See https://github.com/redwoodjs/redwood/releases/tag/v6.6.0

## v6.5.1

- See https://github.com/redwoodjs/redwood/releases/tag/v6.5.1

## v6.5.0

- See https://github.com/redwoodjs/redwood/releases/tag/v6.5.0

## v6.4.2

- See https://github.com/redwoodjs/redwood/releases/tag/v6.4.2

## v6.4.1

- See https://github.com/redwoodjs/redwood/releases/tag/v6.4.1

## v6.4.0

- See https://github.com/redwoodjs/redwood/releases/tag/v6.4.0

## v6.3.3

- See https://github.com/redwoodjs/redwood/releases/tag/v6.3.3

## v6.3.2

- See https://github.com/redwoodjs/redwood/releases/tag/v6.3.2

## v6.3.1

- See https://github.com/redwoodjs/redwood/releases/tag/v6.3.1

## v6.3.0

- See https://github.com/redwoodjs/redwood/releases/tag/v6.3.0

## v6.2.3

- See https://github.com/redwoodjs/redwood/releases/tag/v6.2.3

## v6.2.2

- See https://github.com/redwoodjs/redwood/releases/tag/v6.2.2

## v6.2.1

- See https://github.com/redwoodjs/redwood/releases/tag/v6.2.1

## v6.2.0

- See https://github.com/redwoodjs/redwood/releases/tag/v6.2.0

## v6.1.1

- See https://github.com/redwoodjs/redwood/releases/tag/v6.1.1

## v6.1.0

- See https://github.com/redwoodjs/redwood/releases/tag/v6.1.0

## v6.0.7

- See https://github.com/redwoodjs/redwood/releases/tag/v6.0.7

## v6.0.6

- See https://github.com/redwoodjs/redwood/releases/tag/v6.0.6

## v6.0.5

- See https://github.com/redwoodjs/redwood/releases/tag/v6.0.5

## v6.0.4

- See https://github.com/redwoodjs/redwood/releases/tag/v6.0.4

## v6.0.3

- See https://github.com/redwoodjs/redwood/releases/tag/v6.0.3

## v6.0.2

- See https://github.com/redwoodjs/redwood/releases/tag/v6.0.2

## v6.0.1

- See https://github.com/redwoodjs/redwood/releases/tag/v6.0.1

## v6.0.0

- See https://github.com/redwoodjs/redwood/releases/tag/v6.0.0 for the release notes and https://community.redwoodjs.com/t/redwood-v6-0-0-upgrade-guide/5044 for the upgrade guide

## v5.4.3

- See https://github.com/redwoodjs/redwood/releases/tag/v5.4.3

## v5.4.2

- See https://github.com/redwoodjs/redwood/releases/tag/v5.4.2

## v5.4.1

- See https://github.com/redwoodjs/redwood/releases/tag/v5.4.1

## v5.4.0

- See https://github.com/redwoodjs/redwood/releases/tag/v5.4.0

## v5.3.2

- See https://github.com/redwoodjs/redwood/releases/tag/v5.3.2

## v5.3.1

- See https://github.com/redwoodjs/redwood/releases/tag/v5.3.1

## v5.3.0

- See https://github.com/redwoodjs/redwood/releases/tag/v5.3.0

## v5.2.4

- See https://github.com/redwoodjs/redwood/releases/tag/v5.2.4

## v5.2.3

- See https://github.com/redwoodjs/redwood/releases/tag/v5.2.3

## v5.2.2

- See https://github.com/redwoodjs/redwood/releases/tag/v5.2.2

## v5.2.1

- See https://github.com/redwoodjs/redwood/releases/tag/v5.2.1

## v5.2.0

- See https://github.com/redwoodjs/redwood/releases/tag/v5.2.0

## v5.1.5

- See https://github.com/redwoodjs/redwood/releases/tag/v5.1.5

## v5.1.4

- See https://github.com/redwoodjs/redwood/releases/tag/v5.1.4

## v5.1.3

- See https://github.com/redwoodjs/redwood/releases/tag/v5.1.3

## v5.1.2

- See https://github.com/redwoodjs/redwood/releases/tag/v5.1.2

## v5.1.1

- See https://github.com/redwoodjs/redwood/releases/tag/v5.1.1

## v5.1.0

- See https://github.com/redwoodjs/redwood/releases/tag/v5.1.0

## v5.0.6

- See https://github.com/redwoodjs/redwood/releases/tag/v5.0.6

## v5.0.5

- See https://github.com/redwoodjs/redwood/releases/tag/v5.0.5

## v5.0.4

- See https://github.com/redwoodjs/redwood/releases/tag/v5.0.4

## v5.0.3

- See https://github.com/redwoodjs/redwood/releases/tag/v5.0.3

## v5.0.2

- See https://github.com/redwoodjs/redwood/releases/tag/v5.0.2

## v5.0.1

- See https://github.com/redwoodjs/redwood/releases/tag/v5.0.1

## v5.0.0

- See https://github.com/redwoodjs/redwood/releases/tag/v5.0.0 for the release notes and https://community.redwoodjs.com/t/redwood-v5-0-0-upgrade-guide/4715 for the upgrade guide

## v4.5.0

- See https://github.com/redwoodjs/redwood/releases/tag/v4.5.0

## v4.4.3

- See https://github.com/redwoodjs/redwood/releases/tag/v4.4.3

## v4.4.2

- See https://github.com/redwoodjs/redwood/releases/tag/v4.4.2

## v4.4.1

- See https://github.com/redwoodjs/redwood/releases/tag/v4.4.1

## v4.4.0

- See https://github.com/redwoodjs/redwood/releases/tag/v4.4.0

## v4.3.1

- See https://github.com/redwoodjs/redwood/releases/tag/v4.3.1

## v4.3.0

- See https://github.com/redwoodjs/redwood/releases/tag/v4.3.0

## v4.2.2

- See https://github.com/redwoodjs/redwood/releases/tag/v4.2.2

## v4.2.1

- See https://github.com/redwoodjs/redwood/releases/tag/v4.2.1

## v4.2.0

- See https://github.com/redwoodjs/redwood/releases/tag/v4.2.0

## v4.1.4

- See https://github.com/redwoodjs/redwood/releases/tag/v4.1.4

## v4.1.3

- See https://github.com/redwoodjs/redwood/releases/tag/v4.1.3

## v4.1.2

- See https://github.com/redwoodjs/redwood/releases/tag/v4.1.2

## v4.1.1

- See https://github.com/redwoodjs/redwood/releases/tag/v4.1.1

## v4.1.0

- See https://github.com/redwoodjs/redwood/releases/tag/v4.1.0

## v4.0.1

- See https://github.com/redwoodjs/redwood/releases/tag/v4.0.1

## v4.0.0

- See https://github.com/redwoodjs/redwood/releases/tag/v4.0.0 for the release notes and https://community.redwoodjs.com/t/redwood-v4-0-0-upgrade-guide/4412 for the upgrade guide

## v3.8.0

- See https://github.com/redwoodjs/redwood/releases/tag/v3.8.0

## v3.7.1

- See https://github.com/redwoodjs/redwood/releases/tag/v3.7.1

## v3.7.0

- See https://github.com/redwoodjs/redwood/releases/tag/v3.7.0

## v3.6.1

- See https://github.com/redwoodjs/redwood/releases/tag/v3.6.1

## v3.6.0

- See https://github.com/redwoodjs/redwood/releases/tag/v3.6.0

## v3.5.0

- See https://github.com/redwoodjs/redwood/releases/tag/v3.5.0

## v3.4.0

- See https://github.com/redwoodjs/redwood/releases/tag/v3.4.0

## v3.3.2

- See https://github.com/redwoodjs/redwood/releases/tag/v3.3.2

## v3.3.1

- See https://github.com/redwoodjs/redwood/releases/tag/v3.3.1

## v3.3.0

- See https://github.com/redwoodjs/redwood/releases/tag/v3.3.0

## v3.2.2

- See https://github.com/redwoodjs/redwood/releases/tag/v3.2.2

## v3.2.1

- See https://github.com/redwoodjs/redwood/releases/tag/v3.2.1

## v3.2.0

- See https://github.com/redwoodjs/redwood/releases/tag/v3.2.0

## v3.1.2

- See https://github.com/redwoodjs/redwood/releases/tag/v3.1.2

## v3.1.1

- See https://github.com/redwoodjs/redwood/releases/tag/v3.1.1

## v3.1.0

- See https://github.com/redwoodjs/redwood/releases/tag/v3.1.0

## v3.0.3

- See https://github.com/redwoodjs/redwood/releases/tag/v3.0.3

## v3.0.2

- See https://github.com/redwoodjs/redwood/releases/tag/v3.0.2

## v3.0.1

- See https://github.com/redwoodjs/redwood/releases/tag/v3.0.1

## v3.0.0

- See https://github.com/redwoodjs/redwood/releases/tag/v3.0.0 for the release notes and https://community.redwoodjs.com/t/pending-redwood-3-0-0-is-now-available/3989 for the upgrade guide

## v2.2.5

- See https://github.com/redwoodjs/redwood/releases/tag/v2.2.5

## v2.2.4

- See https://github.com/redwoodjs/redwood/releases/tag/v2.2.4

## v2.2.3

- See https://github.com/redwoodjs/redwood/releases/tag/v2.2.3

## v2.2.2

- See https://github.com/redwoodjs/redwood/releases/tag/v2.2.2

## v2.2.1

- See https://github.com/redwoodjs/redwood/releases/tag/v2.2.1

## v2.2.0

- See https://github.com/redwoodjs/redwood/releases/tag/v2.2.0

## v2.1.1

- See https://github.com/redwoodjs/redwood/releases/tag/v2.1.1

## v2.1.0

- See https://github.com/redwoodjs/redwood/releases/tag/v2.1.0

## v2.0.0

- See https://github.com/redwoodjs/redwood/releases/tag/v2.0.0 for the release notes and upgrade guide

## v1.5.2

- See https://github.com/redwoodjs/redwood/releases/tag/v1.5.2

## v1.5.1

- See https://github.com/redwoodjs/redwood/releases/tag/v1.5.1

## v1.5.0

- See https://github.com/redwoodjs/redwood/releases/tag/v1.5.0

## v1.4.3

- See https://github.com/redwoodjs/redwood/releases/tag/v1.4.3

## v1.4.2

- See https://github.com/redwoodjs/redwood/releases/tag/v1.4.2

## v1.4.1

- See https://github.com/redwoodjs/redwood/releases/tag/v1.4.1

## v1.4.0

- See https://github.com/redwoodjs/redwood/releases/tag/v1.4.0

## v1.3.3

- See https://github.com/redwoodjs/redwood/releases/tag/v1.3.3

## v1.3.2

- See https://github.com/redwoodjs/redwood/releases/tag/v1.3.2

## v1.3.1

- See https://github.com/redwoodjs/redwood/releases/tag/v1.3.1

## v1.3.0

- See https://github.com/redwoodjs/redwood/releases/tag/v1.3.0

## v1.2.1

- See https://github.com/redwoodjs/redwood/releases/tag/v1.2.1

## v1.2.0

- See https://github.com/redwoodjs/redwood/releases/tag/v1.2.0

## v1.1.1

- See https://github.com/redwoodjs/redwood/releases/tag/v1.1.1

## v1.1.0

- See https://github.com/redwoodjs/redwood/releases/tag/v1.1.0

## v1.0.2

- See https://github.com/redwoodjs/redwood/releases/tag/v1.0.2

## v1.0.1

- See https://github.com/redwoodjs/redwood/releases/tag/v1.0.1

## v1.0.0

- See https://github.com/redwoodjs/redwood/releases/tag/v1.0.0-rc.final.1
