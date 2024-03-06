# CHANGELOG

## Unreleased

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

  Fixes #9877. This PR adds CLI functionality to load more `.env` files via `NODE_ENV` and an `--add-env-files` flag.
  Env vars loaded via either of these methods override the values in `.env`:

  ```
  # Loads '.env.production', which overrides values in '.env'
  NODE_ENV=production yarn rw exec myScript

  # Load '.env.stripe' and '.env.nakama', which overrides values
  yarn rw exec myScript --add-env-files stripe --add-env-files nakama
  # Or you can specify the flag once:
  yarn rw exec myScript --add-env-files stripe nakama
  ```

  Note that this feature is mainly for local scripting. Most deploy providers don't let you upload `.env` files (unless you're using baremetal) and usually have their own way of determining environments.

## v7.0.6

- See https://github.com/redwoodjs/redwood/releases/tag/v7.0.6

## v7.0.5

- See https://github.com/redwoodjs/redwood/releases/tag/v7.0.5

## v7.0.4

- See https://github.com/redwoodjs/redwood/releases/tag/v7.0.4

## v7.0.3

- See https://github.com/redwoodjs/redwood/releases/tag/v7.0.3

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
