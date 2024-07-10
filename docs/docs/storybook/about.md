---
description: A component-driven development workflow
---

# Storybook

Storybook enables a kind of frontend-first, component-driven development workflow that we've always wanted.
By developing your UI components in isolation, you get to focus exclusively on your UI's needs,
saving you from getting too caught up in the details of your API too early.

Storybook also makes debugging a lot easier.
You don't have to start the dev server, login as a user, tab through dropdowns, and click buttons just for that one bug to show up.
Or render a whole page and make six GraphQL calls just to change the color of a modal.
You can set it all up as a story, tweak it there as you see fit, and even test it for good measure.

RedwoodJS offers two Storybook integrations. The original, which will be removed in an upcoming major, uses Webpack as its bundler.
It also stores the config files primarily in the `@redwoodjs/testing` package, and allows you to extend this by creating config files in your project.
The latest integration leverages Storybook's [Framework Packages](https://storybook.js.org/docs/configure/integration/frameworks) and Vite to create a more seamless experience.

For more information on why we created a new Storybook setup, see [the forum post](https://community.redwoodjs.com/t/storybook-in-redwood-is-moving-to-vite/7212).

If you're just getting started with Storybook in RedwoodJS, and you're using Vite, get started with [our Storybook Vite docs](./vite.md)!

If you're using Webpack, or just looking for the older docs, see our [Storybook Webpack docs](./webpack.md).