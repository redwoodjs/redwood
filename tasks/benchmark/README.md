# Benchmark Task

Goals:
* Test to make sure responses are correct
  * Context is not clobbered
* Document the ways you can serve your app
* Future: Performance metrics (not designed to show how fast redwood is "in the real world" just for our own knowledge)
* Use k6 for testing
* The testing scenarios
  * N virtual users
  * Over T time
  * We have thresholds for return period, error count, etc...

## Introduction

### How does Redwood handle GraphQL requests?

We are aiming to test the production deployment of the API side of redwood.

**Without server.ts**

Without a server file when a graphql request is recieved by fastify this spins up a new GraphQL Yoga server to satisfy this request. This uses the `createGraphQLHandler` function in `@redwoodjs/graphql-server` to create a new GraphQL Yoga server.

* Launch `yarn rw serve api`
*

**With server.ts**

With a server file when a graphql request is recieved by fastify a this uses a pre-existing long-living GraphQL Yoga server to satisfy this request. This uses the `redwoodFastifyGraphQLServer` fastify plugin which dispatches the request to the existing yoga.

* Run `yarn rw exp setup-server-file`
* Launch `yarn rw serve api`
*

### Test Scenarios
1. Without server file and with context isolation

2. Without server file and without context isolation

3. With server file and with context isolation

4. With server file and without context isolation

### Test Checks
**Context Isolation**
* GraphQL query
  * Set a number to the context
  * Sleep for some time
  * Grab the number from context
  * Return the number
We should have the same number returned if the contect is isolated.

## Usage
...

## Results
...

* Run the test script

