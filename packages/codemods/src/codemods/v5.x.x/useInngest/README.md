# Use Inngest

This codemod configures the RedwoodJS GraphQL api's GraphQL handler to use [Inngest](https://www.inngest.com/).

[Inngest](https://www.inngest.com/) makes it simple for you to write delayed or background jobs by triggering functions from events — decoupling your code from your application.

* You send events from your application via HTTP (or via third party webhooks, e.g. Stripe)
* Inngest runs your serverless functions that are configured to be triggered by those events, either immediately, or delayed.

It relies on the [`envelop-plugin-inngest`](https://github.com/inngest/envelop-plugin-inngest) envelop plugin that sends GraphQL response data to Inngest to help build event-driven applications.

It's philosophy is to:

* "instrument everything" by sending events for each GraphQL execution result to Inngest to effortlessly build event-driven applications.
* provide fine-grained control over what events are sent such as operations (queries, mutations, or subscriptions), introspection events, when GraphQL errors occur, if result data should be included, type and schema coordinate denylists ... and more.
* be customized with event prefix, name and user context functions

## Codemod

This codemod should be used in conjunction with (or will be used by) `yarn dlx inngest-setup-redwoodjs` to setup the main needs of Inngest, including the `src/inngest/plugin` file.

In order to use Inngest, an `inngestPlugin` is imported and added to `extraPlugins`.

```ts
import { createGraphQLHandler } from "@redwoodjs/graphql-server";

import directives from "src/directives/**/*.{js,ts}";
import sdls from "src/graphql/**/*.sdl.{js,ts}";
import services from "src/services/**/*.{js,ts}";

import { getCurrentUser } from "src/lib/auth";
import { db } from "src/lib/db";
import { logger } from "src/lib/logger";

import { inngestPlugin } from "src/inngest/plugin";

export const handler = createGraphQLHandler({
  getCurrentUser,
  loggerConfig: { logger, options: {} },
  directives,
  sdls,
  services,

  onException: () => {
    // Disconnect from your database with an unhandled exception.
    db.$disconnect();
  },

  extraPlugins: [inngestPlugin],
});
```

> Note: If `extraPlugins` already exists and configured other plugins, then `inngestPlugin` is added.
