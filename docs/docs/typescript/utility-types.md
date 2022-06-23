---
title: Redwood Utility Types
description: Utility types exposed by Redwood
---

Apart from generating types for you, Redwood also exposes a handful of utility types that you will see automatically added to your code when you use the generators.

Let's walk through some of them, by the end of this you will likely see a pattern in these types, and the use of [Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)


## Cell

## Scenarios & Testing

## DbAuth
When you setup dbAuth, the generated files in `./api/src/lib/auth.ts`  and `./api/src/functions/auth.ts` will contain all the types you will require. Let's break down some of the utility types

### `DbAuthSession`
At the top of your `src/lib/auth.ts` function you'll notice an import

```
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

  const forgotPasswordOptions: DbAuthHandlerOptions<PrismaUser>['forgotPassword'] = {

    // highlight-next-line
    // in the handler function, user will be automatically typed for you
    handler: (user) => {
      return user
    },


```

##
