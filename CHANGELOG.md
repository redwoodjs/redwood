# CHANGELOG

## Unreleased

- Update jsdoc for ScenarioData type (#29166)

  Fix formatting of JSDocs in `scenario.ts`

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

- Add support for additional env var files (#9961)

  Fixes #9877. This PR adds a new middleware step to the CLI that looks for an `--include-env-files` flag and includes `.env.[file]` to the list of dotfiles to load. This PR also introduces functionality so that `.env.[file]` files are loaded based on `NODE_ENV`.

  Using the `--include-env-files` flag:

  ```bash
  yarn rw exec myScript --include-env-files prod stripe-prod
  # Alternatively you can specify the flag twice:
  yarn rw exec myScript --include-env-files prod --include-env-files stripe-prod
  ```

  Using `NODE_ENV`:

  ```
  # loads .env.production
  NODE_ENV=production yarn rw exec myScript
  ```

  These files are loaded in addition to `.env` and `.env.defaults` and more generally are additive. Subsequent dotfiles won't overwrite environment variables defined previous ones. As such, files loaded via NODE_ENV have lower priority than those loaded specifically via `--include-env-files`.

  Note that this feature is mainly for local scripting. Most deploy providers don't let you upload dotfiles and usually have their own way of determining environments.

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
