# Redwood Studio

## About
This package intends to contain the redwood development studio. The studio contains a dashboard users can use during development to gain insights into their project.

## GraphiQL Auth Impersonation

### DbAuth

Requires `SESSION_SECRET` envar for cookie encryption.

TOML example:

```
[web]
  port = 8888
[studio]
  inMemory = false
  [studio.graphiql]
    endpoint = "graphql"
    [studio.graphiql.authImpersonation]
      authProvider = "dbAuth"
      email = "user@example.com"
      userId = "1"
```

### Netlify


TOML example:

```
[web]
  port = 8888
[studio]
  inMemory = false
  [studio.graphiql]
    endpoint = "graphql"
    [studio.graphiql.authImpersonation]
      authProvider = "netlify"
      email = "user@example.com"
      userId = "1"
      jwtSecret = "some-secret-setting"
```

### Supabase

Requires `SUPABASE_JWT_SECRET` envar for JWT signing.

TOML example:

```
[web]
  port = 8888
[studio]
  inMemory = false
  [studio.graphiql]
    endpoint = "graphql"
    [studio.graphiql.authImpersonation]
      authProvider = "supabase"
      email = "user@example.com"
      userId = "1"
```

## TODO:
  - Everything...
