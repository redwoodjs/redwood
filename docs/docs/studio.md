---
description: RedwoodJS Studio is a package used during development to gain runtime insights into a project.
---

# Studio

RedwoodJS Studio is a package used during development to gain runtime insights into a project.

We want Studio to be an essential tool for every RedwoodJS developer.

- It aids in collaboration, visualization, and measurement of your application.
- It provides a seamless experience, enhancing the enjoyment and insightfulness of developing with RedwoodJS.
- It can serve as a hub for your team, facilitating calls and meetings to demonstrate and discuss new features as they are built, used, and improved.

- It also acts as a gateway to the community and documentation, enabling quick assistance without significant context shifting.


## Motivation

Redwood provides tools that lets developers "get to work on what makes your application special, instead of wasting cycles choosing and re-choosing various technologies and configurations."[1](https://github.com/redwoodjs/redwood/blob/main/README.md).

Much happens while your app processes a request: Invoke a function; handle a GraphQL request; resolve the request with a service; build and execute a SQL statement; connect to the database; handle the query response; further resolve the response so in contains all the data needed; return the result ... and more.

While [logging](https://redwoodjs.com/docs/logger) can show you some of these steps, there is no easy way to see how they relate to each other, compare, or break down individual timings. Observability needed to debug, iterate, try out, and refactor your code is lacking.

We hope Studio helps solve this problem with an observability tool that combines:

* Tracing with OpenTelemetry (service and GraphQL)

* SQL statement logging

* general metrics (how many invocations)

* GraphiQL playground with impersonated authentication

With Studio, it is easier to:

* identify slow running SQL statements without reviewing captured log files

* identify and improve N+1 queries by comparing before and after traces

* impersonate the user authentication headers in GraphiQL

## Features

Here are the features that make Studio a productive and enjoyable tool for creating with RedwoodJS.

### Dashboard

![Dashboard|688x500](https://rwjs-discourse.nyc3.cdn.digitaloceanspaces.com/original/2X/b/b820e8701a9a15406b6d1f751790eab65f5e422f.jpeg)

A quick overview of your app.

- Monitor Database, GraphQL, API, and Network performance in real-time.
- Instantly view the most executed SQL and GraphQL Operations.

### Monitoring

![Monitoring|688x500](https://rwjs-discourse.nyc3.cdn.digitaloceanspaces.com/original/2X/5/5ce73e871bdd34829ab605d85d53068925ae74de.jpeg)

Studio leverages OpenTelemetry data sent from your Redwood app.

- Observe what traces and spans indicate about your app's health.
- Found a problem? Make adjustments and then compare the difference to assess the improvement.

### GraphQL

![GraphQL|688x500](https://rwjs-discourse.nyc3.cdn.digitaloceanspaces.com/original/2X/1/120231e4be9a833e44dbacd7b4b06d56e29926cb.jpeg)


Explore your GraphQL API with ease.

- Visualize your GraphQL Schema.
- Evaluate GraphQL Operations and performance.
- Test your GraphQL API effortlessly in a fully-integrated GraphiQL Playground.
- Supports authenticated User Impersonation.

### Database

![Database|688x500](https://rwjs-discourse.nyc3.cdn.digitaloceanspaces.com/original/2X/5/5d7ce0148db3ae57a80456e862b07bf941017280.jpeg)


Enhance your understanding and usage of your Database and SQL.

- Visualize your Prisma database diagram.
- Explore your data model and its relations.
- Evaluate the performance of SQL statements in detail.

### Mailer

![Mailer|688x500](https://rwjs-discourse.nyc3.cdn.digitaloceanspaces.com/original/2X/d/d4dae3b7fe3ba62ea47fe6f6a10348a5f1e48411.jpeg)


Redwood Studio is closely integrated with [Redwood Mailer](./mailer.md#studio).

- Intercept emails during development.
- Monitor the emails being sent and received.
- Test and preview your email templates.

### Community Search

![Community Search|688x500](https://rwjs-discourse.nyc3.cdn.digitaloceanspaces.com/original/2X/6/6df83d8d5eabec3062f67186107e901159abd427.jpeg)


We’re always here to help.

- Quickly search the RedwoodJS Community, Documentation, and more.
- Get help to build your app faster.
- Just Command-K and go!

### Built with RedwoodJS

Did you know that Studio is built with RedwoodJS?

It showcases:

- Realtime GraphQL to update data
- Cells for data fetching
- Routing for navigation
- Authentication

- … and more.

## Get Started

To begin using Redwood Studio simply execute the following command from your applixcation’s root directory:

```bash

yarn rw studio

```

The first time you run this command, it will install the Studio package, which may take a bit of time. Future launches won't require additional installations.

To start using, visit: `http://localhost:4318`.

:::note
If you would like to serve Studio on a different port, see [basePort](#base-port) configuration.
:::

### Additional Setup

You will want Studio to pick up telemetry from your app automatically (to capture GraphQL and SQL execution traces) please ensure you've setup OpenTelemetry. A guide on this can be found [here](https://community.redwoodjs.com/t/opentelemetry-support-experimental/4772).

## Configuration

### Settings

All settings for Studio are located in `redwood.toml`, which you can find at
the root of your Redwood project.

#### User Impersonation

* `[studio.graphiql.authImpersonation].*` – Used to gain access to GraphQL
  endpoints that require authentication. See section above on auth
  impersonation for more details.

#### Base Port

* `[studio].basePort` – Studio's web front-end will run on this port (default:
  4318). It is also used to calculate the port for the mailer integration and
  other things. Please choose a port that is not already in use, and that has a
  few more free ports available next to it.

#### GraphiQL Auth Impersonation

You need to configure Studio using settings inside `redwood.toml` for auth
impersonation to work. See the sections below for detailed information.

##### DbAuth

Requires a `SESSION_SECRET` environment variable for cookie encryption.

```toml
// redwood.toml

[studio.graphiql.authImpersonation]
  authProvider = "dbAuth"
  email = "user@example.com"
  userId = "1"
```

##### Netlify

Since Netlify does not expose the JWT secret used to sign the token in
production, impersonation requires a `jwtSecret` to encode and decode the auth
token.

```toml
// redwood.toml

[studio.graphiql.authImpersonation]
  authProvider = "netlify"
  email = "user@example.com"
  userId = "1"
  jwtSecret = "some-secret-setting"
```

##### Supabase

Requires a `SUPABASE_JWT_SECRET` environment variable for JWT signing.

```toml
// redwood.toml

[studio.graphiql.authImpersonation]
  authProvider = "supabase"
  email = "user@example.com"
  userId = "1"
```

### Database File 
Studio stores the ingested telemetry to `studio/prisma.db` within the
`.redwood` folder. You should not need to touch this file other than if you
wish to delete it to erase any existing telemetry data.

## Troubleshooting

We hope you don't encounter any issues, but here are some ways to troubleshoot Studio. As always, you can find us on Discourse Forums or GitHub issues to report problems.

### Concurrency Limit Reached

If you see an 'OpenTelemetry concurrency limit reached' error in your logs, consider increasing the `concurrencyLimit` value in your OpenTelemetry configuration.

```tsx

// api/src/opentelemetry.ts

// ...

const studioPort = getConfig().studio.basePort

const exporter = new OTLPTraceExporter({
  // Update this URL to point to where your OTLP compatible collector is listening
  // The redwood development studio (`yarn rw studio`) can collect your
  // telemetry at `http://127.0.0.1:<PORT>/.redwood/functions/otel-trace`
  // (default PORT is 4318)
  url: `http://127.0.0.1:${studioPort}/.redwood/functions/otel-trace`,
  concurrencyLimit: 64, // <- increase 
})

// ...
```

### Timeouts

If your application experiences any timeouts while sending telemetry data to Studio, you can increase the timeout by adding a `timeoutMillis` value (the default is 10 seconds).

```tsx

// api/src/opentelemetry.ts

// ...

const studioPort = getConfig().studio.basePort

const exporter = new OTLPTraceExporter({
  // Update this URL to point to where your OTLP compatible collector is listening
  // The redwood development studio (`yarn rw studio`) can collect your
  // telemetry at `http://127.0.0.1:<PORT>/.redwood/functions/otel-trace`
  // (default PORT is 4318)
  url: `http://127.0.0.1:${studioPort}/.redwood/functions/otel-trace`,
  concurrencyLimit: 64,
  timeoutMillis: 30000, // <-- set a timout greater than 10 seconds
})

// ...
```
 
### Connection Refused

If your application cannot connect to Studio, please ensure the following:

- Studio should be running before you launch your app's development server.

- If you stop Studio while your app is running in development mode, remember to restart your app after restarting Studio.


## Legacy Studio

Studio has been rewritten and is available as part of RedwoodJS v7. Previously it was available as an [experimental feature](https://community.redwoodjs.com/t/redwood-studio-experimental/4771). 
