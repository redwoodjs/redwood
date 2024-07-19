---
description: Newer version of Storybook integration; uses Vite
---

# Storybook Vite

These docs are for the latest Storybook integration, which uses Vite and stores its config files completely in your project.

If you're just getting started with Storybook in RedwoodJS, or you're looking to upgrade to the latest version, you're in the right place!

## Getting Started with Storybook Vite

You can start Storybook with `yarn rw storybook-vite`:

```
yarn rw storybook-vite
```

If this is your first time running Storybook, the Redwood CLI will install it.
From then on, you can run it straightaway.
Once Storybook is installed, it'll spin up on port `7910`.

Additionally, if it's your first time running `storybook-vite`, the Redwood CLI will create the following config files for you:
- `web/.storybook/main.ts`
  - This is the primary [Storybook configuration file](https://storybook.js.org/docs/configure). Note that it references the brand new framework package, [`storybook-framework-redwoodjs-vite`](https://www.npmjs.com/package/storybook-framework-redwoodjs-vite).
- `web/.storybook/preview-body.html`
  - This is required to change the `id` of the root div to `redwood-app`, which is what the entry file used by Vite requires.

Once Storybook is all set up, it'll spin up on port `7910`.

## Migrating from Storybook Webpack to Storybook Vite

If you don't have any of your own [Storybook configuration](https://redwoodjs.com/docs/storybook#configuring-storybook), you should be good to go - no changes needed. The Out of Box experience should be the same, and please [let us know](https://github.com/redwoodjs/redwood/issues/new?assignees=&labels=bug%2Fneeds-info&projects=&template=bug-report.yml&title=%5BBug%3F%5D%3A+) if you run into any issues.

If you do have custom Storybook configuration, then you'll need to manually migrate it over to the new files. For example, if you've got any global decorators, you can now just follow the official Storybook docs on that: https://storybook.js.org/docs/writing-stories/decorators#global-decorators

## Configuring Storybook Vite

To configure Storybook Vite, please follow [the official Storybook docs](https://storybook.js.org/docs/configure).
