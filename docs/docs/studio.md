---
description: RedwoodJS Studio is a package used during development to gain runtime insights into a project.
---

# Studio

RedwoodJS Studio is a package used during development to gain runtime insights into a project.

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

Redwood Studio is a command line tool which offers a web UI aimed at providing insights into your application via OpenTelemetry ingestion and other development conveniences like auth-impersonation within GraphiQL.

### Demo
<div class="video-container">
  <iframe width="560" height="315" src="https://www.youtube.com/embed/zAViN-J-iFs?si=YywnOvMT1Fy3hKzd" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
</div>

### Setup
There is no setup needed to begin using the studio; simply execute the following command to start the studio at `localhost:4318`:
```bash
yarn rw studio
```
The first time you run this command it will likely install the studio package which may take a small amount of time.

#### OpenTelemetry
If you want studio to pick up telemetry from you app automatically please ensure you've setup opentelemetry. A guide on this can be found [here](https://community.redwoodjs.com/t/opentelemetry-support-experimental/4772?u=josh-walker-gm)

### Features
#### TOML
The following TOML options are now available which can control the studio behaviour.
```toml
[studio.graphiql.authImpersonation]
  # authProvider = undefined (default value)
  jwtSecret = 'secret'
  # userId = undefined (default value)
  # email = undefined (default value)
  # roles = undefined (default value)
```

#### GraphiQL Auth Impersonation

##### DbAuth

Requires `SESSION_SECRET` envar for cookie encryption.

TOML example:

```toml
[studio.graphiql.authImpersonation]
  authProvider = "dbAuth"
  email = "user@example.com"
  userId = "1"
```

##### Netlify

Since Netlify does not expose the JWT secret used to sign the token in production, impersonation requires a `jwtSecret` to encode and decode the auth token.

TOML example:

```toml
[studio.graphiql.authImpersonation]
  authProvider = "netlify"
  email = "user@example.com"
  userId = "1"
  jwtSecret = "some-secret-setting"
```

##### Supabase

Requires `SUPABASE_JWT_SECRET` envar for JWT signing.

TOML example:

```toml
[studio.graphiql.authImpersonation]
  authProvider = "supabase"
  email = "user@example.com"
  userId = "1"
```

#### Database File 
Studio stores the ingested telemetry to `studio/prisma.db` within the `.redwood` folder. You should not need to touch this file other than if you wish to delete it to erase any existing telemetry data.

## Availability
The setup command is currently available from the `canary` version of Redwood. You can try this out in a new project by running `yarn rw upgrade --tag canary` and following any general upgrade steps recommend on the [forums](https://community.redwoodjs.com/c/announcements/releases-and-upgrade-guides/18).
