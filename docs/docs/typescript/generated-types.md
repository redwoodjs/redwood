---
title: Generated Types
description: A deeper look at automatic type generation in Redwood
---

## Auto-generated Types

The CLI automatically generates types for you.
These generated types not only include your GraphQL queries, but also your named routes, Cells, scenarios, and tests.

When you run `yarn rw dev`, the CLI watches for file changes and triggers the type generator, but you can also trigger it manually:

```
yarn rw g types
```

If you get errors trying to generate types, its worth checking your queries in your Cells and SDLs, to make sure every query and mutation on the web side is also defined in the *.sdl.{js/ts} files in the api side.

If you're curious, you can find the generated types in the `.redwood/types`, `web/types/graphql.d.ts`, and `api/types/graphql.d.ts` directories. Broadly speaking Redwood generates the following:

1. Generate "mirror" types for your components, Cells and layouts on the web side
2. Generate types based on your queries and mutations on the web side (in ./web/types/graphql.d.ts)
3. Generate types for resolvers based on your SDLs on the api side (in ./api/types/graphql.d.ts)

## Query and Mutation types
On the web side, let's say you have a query in a Cell that looks like this:

```js
export const QUERY = gql`
 /* 👇 query/mutation should be named */
 // highlight-next-line
  query FindBlogPostQuery($id: Int!) {
    blogPost: post(id: $id) {
      title
      body
    }
  }
`
```

The type will use the query name, in this case `FindBlogPostQuery`. So can import these generated types:

```js
import { FindBlogPostQuery, FindBlogPostQueryVariables } from 'types/graphql'
```

- `FindBlogPostQuery` is the type for the returned data in this case `{title: string, body: string}`
- `FindBlogPostQueryVariables` is the type of the inputs - in this case `{id: number}`

But don't worry too much, if you use Redwood's CLI - we template all of this for you!


## Resolver Types
On the API side, generated services include types for query and mutation resolvers.

```js
import type { QueryResolvers, MutationResolvers } from 'types/graphql'

// highlight-next-line
export const posts: QueryResolvers['posts'] = () => {
}

// highlight-next-line
export const createPost: MutationResolvers['createPost'] = ({ input }) => {
   //..
}
```

These types help you by making sure you're returning the object you've defined in your SDL. Note that these types expect you to return the _complete_ type that you've defined in your SDL. You can just return the result of the Prisma query, and not have to worry about how, for example, a DateTime in Prisma maps to a String in GraphQL.

:::note
A note on union types - lets say in your SDL you return a union type

```graphql
  type OutOfStock {
    message: String!
  }

// highlight-next-line
 union CandyResult = Candy | OutOfStock

type Query {
  candy(id: String!): CandyResult @skipAuth
 ```

These types will also be handled automatically. But if you are returning a different Prisma model, you may need to write your own resolver type, as the type generator will not know how to map the Prisma type to the GraphQL return type.
:::


## What's happening under the hood

Redwood uses [GraphQL Code Generator](https://www.graphql-code-generator.com) to generate types for your GraphQL queries, mutations and SDLs. We configure it to use the types from your generated prisma client too on the API side, to make sure your resolvers are strongly typed.



### Customising codegen config
While the defaults are configured so that things JustWork™️, you can customize them by adding a `./codegen.yml` file to the root of your project. Your custom settings will be merged with the built-in ones.

:::info
If you're curious about the built-in settings, they can be found [here](https://github.com/redwoodjs/redwood/blob/main/packages/internal/src/generate/graphqlCodeGen.ts) in the Redwood source. Look for the `generateTypeDefGraphQLWeb` and `generateTypeDefGraphQLApi` functions.
:::


For example, adding this `codegen.yml` to the root of your project will transform all the generated types to UPPERCASE:

```yml
# ./codegen.yml

config:
  namingConvention:
    typeNames: change-case-all#upperCase
```

Remember you can configure graphql-codegen in a number of different ways - codegen.yml, codegen.json or codegen.js - or even a key called codegen in your root package.json. Codegen uses [cosmiconfig](https://github.com/davidtheclark/cosmiconfig#cosmiconfig) under the hood, so take a peek at their docs for all the possible ways to configure.

For completeness, [here's the docs](https://www.graphql-code-generator.com/docs/config-reference/config-field) on configuring GraphQL Code Generator. Note that we currently only support the root level `config` option.



:::tip
If you're using VSCode, the GraphQL extension will also configure itself based on the merged schema Redwood generates in `.redwood/schema.graphql` as part of type generation.

You can configure it further in `graphql.config.js` at the root of your project
:::
