---
title: Redwood Utility Types
description: Utility types exposed by Redwood
---

Apart from generating types for you, Redwood also exposes a handful of utility types that you will see automatically added to your code when you use the generators.

Let's walk through some of them, by the end of this you will likely see a pattern in these types, and the use of [Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)


## Cell
Cells created using Redwood CLI's generators contain all the types you normally need, in particular

### `CellSuccessProps<TData, TVariables>`
Used to type the props of your Success component in the cell. This takes two arguments as generics,

1. `TData` - the type of data you are expecting to receive - usually the generated type from the query
2. `TVariables` - an optional second parameter for the type of query variables.

For example:

```ts title=BlogPost.cell.tsx
import type { FindBlogPostQuery, FindBlogPostQueryVariables } from 'types/graphql'
// highlight-next-line
import type { CellSuccessProps } from '@redwoodjs/web'

// highlight-next-line
type SuccessProps = CellSuccessProps<FindBlogPostQuery, FindBlogPostQueryVariables>

export const Success = ({
  blogPost, // your data type
  refetch, // 👈 these other props from Apollo client are also typed
  fetchMore
}: SuccesProps) => (
  // ...
```

This will not only type the "data" portion of your success, but type the other props that come by default from Apollo client.

### `CellFailureProps<TVariables>`
This gives you the props in your Cell's `Failure` component


```ts title=BlogPost.cell.tsx
// highlight-next-line
import type { CellFailureProps } from '@redwoodjs/web'

export const Failure = ({
  error,
  variables // 👈 variables typed here, based on the generic
// highlight-next-line
}: CellFailureProps<FindBlogPostQueryVariables>) => (
 //...
```

It takes `TVariables` as an optional generic paramter, which is useful for example if you want to print error messages like "Could not load data for ${variables.searchTerm}"

### `CellLoadingProps<TVariables>`
Similar to the Failure types, to use for your `Loading` component.

```ts title=BlogPost.cell.tsx
// highlight-next-line
import type { CellLoadingProps } from '@redwoodjs/web'

export const Loading = (props: CellLoadingProps<BlogPostQueryVariables>) => <div>Loading...</div>
```


## Scenarios & Testing
In your API side, when you generate services and sdls, we generate the tests and scenarios with all the required types. Let's take a deeper look at scenario types.

### `defineScenario`
This is actually a function, rather than a type. But it does take a lot of generics - use many or little as you find helpful.

`defineScenario<PrismaCreateType, TName, TKeys>`
- `PrismaCreateType` (optional) - the type imported from Prisma's create that goes into the "data" key
- `TName` (optional) - the name or names of the models for your scenario
- `TKey` (optional) - the keys in your scenario. These are really only useful while you write out the sceanrio


Some examples:

```ts title=posts.scenarios.ts
import type { Prisma, Post } from '@prisma/client'

//highlight-next-line
export const standard = defineScenario<Prisma.PostCreateArgs, 'post', 'one'>({
//👇 TName
// highlight-next-line
  post: {
 // 👇 TKey
 // highlight-next-line
    one: {
      // PrismaCreateType 👇, notice how we imported the type from Prisma client
      data: { title: 'String', body: 'String', metadata: { foo: 'bar' } },
    },
  },
})
```

When you have multiple types in a single scenario you can use unions

```ts
// Example scenario where we define both "post" and "user"
defineScenario<Prisma.PostCreateArgs | Prisma.UserCreateArgs, 'post' | 'user'>
```

### `ScenarioData<TModel, TName, TKeys>`
This utility type makes it easy for you to access data created in your scenarios in your tests, in the accompanying .test.ts file.

```ts title=posts.scenario.ts
import type { Post } from '@prisma/client'

//...

export type StandardScenario = ScenarioData<Post, 'post'>
```

```ts title=posts.test.ts
// imported type from your scenario, defined as ScenarioData<Post, 'post'>
import type { StandardScenario } from './posts.scenarios'

scenario('returns a single post', async (scenario: StandardScenario) => {
  const result = await post({ id: scenario.post.one.id })
```

This gives you type safety in your test. You can ofcourse just define the type in this file, instead of importing it - just be aware that if you change your scenario you need to update this type too!


It takes three generic paramters:
- `TData` - the Prisma model that'll be returned
- `TName` (optional) - the key, in the example above this is "post" in scenario.post
- `TKey` (optional) - the name of your scenarios, in the example above its "one"

We know this is a lot of generics - but _you choose_ how specific you want to be with the types!

## DbAuth
When you setup dbAuth, the generated files in `./api/src/lib/auth.ts`  and `./api/src/functions/auth.ts` will contain all the types you will require. Let's break down some of the utility types

### `DbAuthSession`
At the top of your `src/lib/auth.ts` function you'll notice an import

```ts
import type { DbAuthSession } from '@redwoodjs/api'
```

The `DbAuthSession` type takes a generic, for example `DbAuthSession<string>`. The passed in generic should be the type of your id of your `User` model. This is usually a string or number - depending on how you've defined it in your Prisma model for your User.

Because session only ever contains `id`, all we're doing is just definining the type of id.


### `DbAuthHandlerOptions`
The `DbAuthHandlerOptions` from `@redwoodjs/api` will give you access to all the types needed to configure your auth handler function in `./api/src/function/auth.ts`.

This also takes a generic, `TUser` the type of your User model. Note that this is not the same type as `CurrentUser`

For example, we can import the `User` model directly from Prisma

```ts
import type { User as PrismaUser } from '@prisma/client'
import type { DbAuthHandlerOptions } from '@redwoodjs/api'

  //              pass in the generic to the type here 👇
  // highlight-next-line
  const forgotPasswordOptions: DbAuthHandlerOptions<PrismaUser>['forgotPassword'] = {

    // in the handler function, user will be typed for you
    // highlight-next-line
    handler: (user) => {
      return user
    },

    //...
```

Note that in strict mode you will likely see errors where the handlers expect "truthy" values - all you have to do is make sure you return a boolean for example `return !!user` instead of `return user`
