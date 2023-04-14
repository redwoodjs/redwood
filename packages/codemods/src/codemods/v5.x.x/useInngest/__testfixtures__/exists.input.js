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
  extraPlugins: [inngestPlugin],
  onException: () => {
    // Disconnect from your database with an unhandled exception.
    db.$disconnect();
  },
});
