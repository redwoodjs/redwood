# Mocking GraphQL Requests

Testing and building components without relying on the API is a best practice.
Redwood enables this via `mockGraphQLQuery` and `mockGraphQLMutation`.

The argument signatures of these functions are identical.
Internally, they target different operation types based on their suffix.

```js
mockGraphQLQuery('OperationName', (variables, { ctx, req }) => {
  ctx.delay(1_500) // Pause for 1.5 seconds

  return {
    userProfile: {
      id: 42,
      name: 'peterp',
    }
  }
})
```

## The Operation Name

The first argument is the [operation name](https://graphql.org/learn/queries/#operation-name).
It's used to associate mock data with a query or a mutation:

```js
query UserProfileQuery { /*...*/ }
mockGraphQLQuery('UserProfileQuery', { /*... */ })
```

```js
mutation SetUserProfile { /*...*/ }
mockGraphQLMutation('SetUserProfile', { /*... */ })
```

## The Mock Data

The second argument can be an object or a function:

```js {1}
mockGraphQLQuery('OperationName', (variables, { ctx }) => {
  ctx.delay(1500) // pause for 1.5 seconds
  return {
    userProfile: {
      id: 42,
      name: 'peterp',
    }
  }
})
```

If it's a function, it'll receive two arguments: `variables` and `{ ctx }`.
You adjust the response using the `ctx` object.
For example, use `ctx.status` to set an HTTP response code:

```js {2}
mockGraphQLQuery('OperationName', (_variables, { ctx }) => {
  ctx.status(404)
})
```

`ctx.delay` delays the response:

```js {2}
mockGraphQLQuery('OperationName', (_variables, { ctx }) => {
  ctx.delay(1_500) // Pause for 1.5 seconds
  return { id: 42 }
})
```

`ctx.errors` returns an error object in the response:

```js {2}
mockGraphQLQuery('OperationName', (_variables, { ctx }) => {
  ctx.errors([{ message: 'Uh, oh!' }])
})
```

## Global Mock Requests vs Local Mock Requests

Placing your mock-requests in `"<name>.mock.js"` causes them to be globally scoped in Storybook, making them available to all stories.

> **All stories?**
>
> In React, it's often the case that a single component will have a deeply nested component that perform a GraphQL query or mutation.
> Having to mock those requests for every story can be painful and tedious.

Using `mockGraphQLQuery` or `mockGraphQLMutation` inside a story is locally scoped and overwrites a globally-scoped mock-request.

We suggest always starting with globally-scoped mocks.

## Mocking a Cell's `QUERY`

To mock a Cell's `QUERY`, find the file ending in `.mock.js` in the Cell's directory.
This file exports a function named `standard`, which returns mock data for the Cell's `QUERY`:

```js title="UserProfileCell/UserProfileCell.js"
export const QUERY = gql`
  query UserProfileQuery {
    userProfile {
       id
    }
  }
`

// UserProfileCell/UserProfileCell.mock.js
export const standard = () => ({
  userProfile: {
    id: 42
  }
})
```

Since the value assigned to `standard` is the mock-data associated with the `QUERY`, modifying the `QUERY` means you also need to modify the mock-data.

```diff
// UserProfileCell/UserProfileCell.js
export const QUERY = gql`
  query UserProfileQuery {
    userProfile {
       id
+      name
    }
  }
`

// UserProfileCell/UserProfileCell.mock.js
export const standard = {
  userProfile: {
    id: 42,
+   name: 'peterp',
  }
}
```
