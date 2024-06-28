# CHANGELOG

## Unreleased

- fix(esm): use CJS wrapper for ESM default interop (#10119)

  This PR builds on the work started in https://github.com/redwoodjs/redwood/pull/10083 around ESM. One of the caveats of that PR was that the default export from `@redwoodjs/vite` broke. The workaround was referencing the `default` property on the Redwood Vite plugin, like `redwood.default()`. This fixes the ES module default export interoperability so that no change is necessary in switching between module types.

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

## v7.1.0

- See https://github.com/redwoodjs/redwood/releases/tag/v7.1.0

## v7.0.7

- See https://github.com/redwoodjs/redwood/releases/tag/v7.0.7

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
