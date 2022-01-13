---
id: adding-comments-to-the-schema
title: "Adding Comments to the Schema"
sidebar_label: "Adding Comments to the Schema"
---

Let's take a moment to appreciate how amazing this is—we built, designed and tested a completely new component for our app, which displays data from an API call (which would pull that data from a database) without actually having to build any of that backend functionality! Redwood let us provide fake data to Storybook and Jest so we could get our component working.

Unfortunately, even with all of this flexibility there's still no such thing as a free lunch. Eventually we're going to have to actually do that backend work. Now's the time.

If you went through the first part of the tutorial you should be somewhat familiar with this flow:

1. Add a model to `schema.prisma`
2. Run a `yarn rw prisma migrate dev` commands to create a migration and apply it to the database
3. Generate an SDL and service

### Adding the Comment model

Let's do that now:

```javascript {17,29-36}
// api/db/schema.prisma

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider      = "prisma-client-js"
  binaryTargets = "native"
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  body      String
  comments  Comment[]
  createdAt DateTime @default(now())
}

model Contact {
  id        Int      @id @default(autoincrement())
  name      String
  email     String
  message   String
  createdAt DateTime @default(now())
}

model Comment {
  id        Int      @id @default(autoincrement())
  name      String
  body      String
  post      Post     @relation(fields: [postId], references: [id])
  postId    Int
  createdAt DateTime @default(now())
}
```

Most of these lines look very similar to what we've already seen, but this is the first instance of a [relation](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-schema/relations) between two models. `Comment` gets two entries:

* `post` which has a type of `Post` and a special `@relation` keyword that tells Prisma how to connect a `Comment` to a `Post`. In this case the field `postId` references the field `id` in `Post`
* `postId` is just a regular `Int` column which contains the `id` of the `Post` that this comment is referencing

This gives us a classic database model:

```
┌───────────┐       ┌───────────┐
│   Post    │       │  Comment  │
├───────────┤       ├───────────┤
│ id        │───┐   │ id        │
│ title     │   │   │ name      │
│ body      │   │   │ body      │
│ createdAt │   └──<│ postId    │
└───────────┘       │ createdAt │
                    └───────────┘
```

Note that there is no real database column named `post` in `Comment`—this is special syntax for Prisma to know how to connect the models together and for you to reference that connection. When you query for a `Comment` using Prisma you can get access to the attached `Post` using that name:

```javascript
db.comment.findUnique({ where: { id: 1 }}).post()
```

Prisma also added a convenience `comments` field to `Post` which gives us the same capability in reverse:

```javascript
db.post.findUnique({ where: { id: 1 }}).comments()
```

### Running the Migration

This one is easy enough: we'll create a new migration with a name and then run it:

```bash
yarn rw prisma migrate dev
```

When prompted, give this one a name something like "create comments".

> You'll need to restart the test suite runner at this point if it's still running. Redwood creates a second, test database for you to run your tests against (it is at `.redwood/test.db` by default). The database migrations are run against that test database whenever the test suite is **started**, not while it's running, so you'll need to restart it to test against the new database structure.

### Creating the SDL and Service

Next we'll create the SDL (that defines the GraphQL interface) and a service (to get the records out of the database) with a generator call:

```bash
yarn rw g sdl comment
```

That command will create both the SDL and the service. One change we'll need to make to the generated code is to allow access to anonymous users to view all comments. Change the `@requireAuth` directive to `@skipAuth` instead:

```javascript{14}
// api/src/graphql/comments.sdl.js

export const schema = gql`
  type Comment {
    id: Int!
    name: String!
    body: String!
    post: Post!
    postId: Int!
    createdAt: DateTime!
  }

  type Query {
    comments: [Comment!]! @skipAuth
  }

  input CreateCommentInput {
    name: String!
    body: String!
    postId: Int!
  }

  input UpdateCommentInput {
    name: String
    body: String
    postId: Int
  }
`
```

Now if you take a look back in the browser you should see a different message than the GraphQL error we were seeing before:

![image](https://user-images.githubusercontent.com/300/101552505-d1405100-3967-11eb-883f-1227689e5f88.png)

"Empty" means the Cell rendered correctly! There just aren't any comments in the database yet. Let's update the **CommentsCell** component to make that "Empty" message a little more friendly:

```javascript {4}
// web/src/components/CommentsCell/CommentsCell.js

export const Empty = () => {
  return <div className="text-center text-gray-500">No comments yet</div>
}
```

That's better. Let's update the test that covers the Empty component render as well:

```javascript {4-5}
// web/src/components/CommentsCell/CommentsCell.test.js

test('Empty renders a "no comments" message', () => {
  render(<Empty />)
  expect(screen.getByText('No comments yet')).toBeInTheDocument()
})
```

Okay, let's focus on the service for bit. We'll need to add a function to let users create a new comment and we'll add a test that covers the new functionality.

### Building out the Service

By virtue of using the generator we've already got the function we need to select all comments from the database:

```javascript
// api/src/services/comments/comments.js

export const comments = () => {
  return db.comment.findMany()
}
```

> Have you noticed that something may be amiss? This function returns *all* comments, and all comments only. Could this come back to bite us?
>
> Hmmm...

We need to be able to create a comment as well. We'll use the same convention that's used in Redwood's generated scaffolds: the create endpoint will accept a single parameter `input` which is an object with the individual model fields:

```javascript
// api/src/services/comments/comments.js

export const createComment = ({ input }) => {
  return db.comment.create({
    data: input,
  })
}
```

We'll also need to expose this function via GraphQL so we'll add a Mutation to the SDL and use `@skipAuth` since, again, it can be accessed by everyone:

```graphql {29-31}
// api/src/graphql/comments.sdl.js

export const schema = gql`
  type Comment {
    id: Int!
    name: String!
    body: String!
    post: Post!
    postId: Int!
    createdAt: DateTime!
  }

  type Query {
    comments: [Comment!]! @skipAuth
  }

  input CreateCommentInput {
    name: String!
    body: String!
    postId: Int!
  }

  input UpdateCommentInput {
    name: String
    body: String
    postId: Int
  }

  type Mutation {
    createComment(input: CreateCommentInput!): Comment! @skipAuth
  }
`
```

> The `CreateCommentInput` type was already created for us by the SDL generator.

That's all we need to create a comment! But let's think for a moment: is there anything else we need to do with a comment? Let's make the decision that users won't be able to update an existing comment. And we don't need to select individual comments (remember earlier we talked about the possibility of each comment being responsible for its own API request and display, but we decided against it).

What about deleting a comment? We won't let a user delete their own comment, but as owners of the blog we should be able to delete/moderate them. So we'll need a delete function and API endpoint as well. Let's add those:

```javascript
// api/src/services/comments/comments.js

export const deleteComment = ({ id }) => {
  return db.comment.delete({
    where: { id },
  })
}
```

```graphql {5}
// api/src/graphql/comments.sdl.js

type Mutation {
  createComment(input: CreateCommentInput!): Comment!
  deleteComment(id: Int!): Comment!
}
```

`deleteComment` will be given a single argument, the ID of the comment to delete, and it's required. A common pattern is to return the record that was just deleted in case you wanted to notify the user or some other system about the details of the thing that was just removed, so we'll do that here as well. But, you could just as well return `null`.

### Testing the Service

Let's make sure our service functionality is working and continues to work as we modify our app.

If you open up `api/src/services/comments/comments.test.js` you'll see there's one in there already, making sure that retrieving all comments (the default `comments()` function that was generated along with the service) works:

```javascript
// api/src/services/comments/comments.test.js

import { comments } from './comments'

describe('comments', () => {
  scenario('returns a list of comments', async (scenario) => {
    const list = await comments()

    expect(list.length).toEqual(Object.keys(scenario.comment).length)
  })
})
```

What is this `scenario()` function? That's made available by Redwood that mostly acts like Jest's built-in `it()` and `test()` functions, but with one important difference: it pre-seeds a test database with data that is then passed to you in the `scenario` argument. You can count on this data existing in the database and being reset between tests in case you make changes to it.

> **In the section on mocks you said relying on data in the database for testing was dumb?**
>
> Yes, all things being equal it would be great to not have these tests depend on a piece of software outside of our control.
>
> However, the difference here is that in a service almost all of the logic you write will depend on moving data in and out of a database and it's much simpler to just let that code run and *really* access the database, rather than trying to mock and intercept each and every possible call that Prisma could make.
>
> Not to mention that Prisma itself is currently under heavy development and implementations could change at any time. Trying to keep pace with those changes and constantly keep mocks in sync would be a nightmare!
>
> That being said, if you really wanted to you could use Jest's [mocking utilities](https://jestjs.io/docs/en/mock-functions) and completely mock the Prisma interface abstract the database away completely. But don't say we didn't warn you!

Where does that data come from? Take a look at the `comments.scenarios.js` file which is next door:

```javascript
export const standard = defineScenario({
  comment: {
    one: {
      data: {
        name: 'String',
        body: 'String',
        post: { create: { title: 'String', body: 'String' } },
      },
    },
    two: {
      data: {
        name: 'String',
        body: 'String',
        post: { create: { title: 'String', body: 'String' } },
      },
    },
  },
})
```

This calls a `defineScenario()` function which checks that your data structure matches what's defined in Prisma. Each scenario data object (for example, `scenario.comment.one`) is passed as-is to Prisma's [`create`](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#create). That way you can customize the scenario object using any of Prisma's supported options.

> **The "standard" scenario**
>
> The exported scenario here is named "standard." Remember when we worked on component tests and mocks, there was a special mock named `standard` which Redwood would use by default if you didn't specify a name? The same rule applies here! When we add a test for `createComment()` we'll see an example of using a different scenario with a unique name.

The nested structure of a scenario is defined like this:

* **comment**: the name of the model this data is for
  * **one, two**: a friendly name given to the scenario data which you can reference in your tests
    * **data**: contains the actual data that will be put in the database
      * **name, message, post**: fields that correspond to the schema. In this case a **Comment** requires that it be related to a **Post**, so the scenario has a `post` key and values as well (using Prisma's [nested create syntax](https://www.prisma.io/docs/concepts/components/prisma-client/relation-queries#nested-writes))
    * **select, include**: optionally, to customize the object to `select` or `include` related fields [using Prisma's syntax](https://www.prisma.io/docs/concepts/components/prisma-client/relation-queries#create-a-related-record)

When you receive the `scenario` argument in your test, the `data` key gets unwrapped so that you can reference fields like `scenario.comment.one.name`.

> **Why does every field just contain the string "String"?**
>
> When generating the service (and the test and scenarios) all we (Redwood) knows about your data is the types for each field as defined in `schema.prisma`, namely `String`, `Integer` or `DateTime`. So we add the simplest data possible that fulfills the type requirement by Prisma to get the data into the database. You should definitely replace this data with something that looks more like the real data your app will be expecting. In fact...

Let's replace that scenario data with something more like what we expect to see in our app:

```javascript {4-29}
// api/src/services/comments/comments.scenarios.js

export const standard = defineScenario({
  comment: {
    jane: {
      data: {
        name: 'Jane Doe',
        body: 'I like trees',
        post: {
          create: {
            title: 'Redwood Leaves',
            body: 'The quick brown fox jumped over the lazy dog.'
          }
        }
      }
    },
    john: {
      data: {
        name: 'John Doe',
        body: 'Hug a tree today',
        post: {
          create: {
            title: 'Root Systems',
            body: 'The five boxing wizards jump quickly.'
          }
        }
      }
    }
  }
})
```

The test created by the service generator simply checks to make sure the same number of records are returned so changing the content of the data here won't affect the test.

#### Testing createComment()

Let's add our first service test by making sure that `createComment()` actually stores a new comment in the database. When creating a comment we're not as worried about existing data in the database so let's create a new scenario which only contains a post—the post we'll be linking the new comment to through the comment's `postId` field:

```javascript {7-16}
// api/src/services/comments/comments.scenarios.js

export const standard = defineScenario({
  // ...
})

export const postOnly = defineScenario({
  post: {
    bark: {
      data: {
        title: 'Bark',
        body: "A tree's bark is worse than its bite"
      }
    }
  }
})
```

Now we can pass the `postOnly` scenario name as the first argument to a new `scenario()` test:

```javascript {3,12-25}
// api/src/services/comments/comments.test.js

import { comments, createComment } from './comments'

describe('comments', () => {
  scenario('returns a list of comments', async (scenario) => {
    const list = await comments()

    expect(list.length).toEqual(Object.keys(scenario.comment).length)
  })

  scenario('postOnly', 'creates a new comment', async (scenario) => {
    const comment = await createComment({
      input: {
        name: 'Billy Bob',
        body: 'What is your favorite tree bark?',
        postId: scenario.post.bark.id
      }
    })

    expect(comment.name).toEqual('Billy Bob')
    expect(comment.body).toEqual('What is your favorite tree bark?')
    expect(comment.postId).toEqual(scenario.post.bark.id)
    expect(comment.createdAt).not.toEqual(null)
  })
})
```

We pass an optional first argument to `scenario()` which is the named scenario to use, instead of the default of "standard."

We were able to use the `id` of the post that we created in our scenario because the scenarios contain the actual database data after being inserted, not just the few fields we defined in the scenario itself. In addition to `id` we could access `createdAt` which is defaulted to `now()` in the database.

We'll test that all the fields we give to the `createComment()` function are actually created in the database, and for good measure just make sure that `createdAt` is set to a non-null value. We could test that the actual timestamp is correct, but that involves freezing the Javascript Date object so that no matter how long the test takes, you can still compare the value to `new Date` which is right *now*, down to the millisecond. While possible, it's beyond the scope of our easy, breezy tutorial since it gets [very gnarly](https://codewithhugo.com/mocking-the-current-date-in-jest-tests/)!

> **What's up with the names for scenario data? posts.bark? Really?**
>
> This makes reasoning about your tests much nicer! Which of these would you rather work with:
>
>   "`claire` paid for an `ebook` using her `visa` credit card."
>
> or:
>
>   "`user[3]` paid for `product[0]` using their `cards[2]` credit card?
>
> If you said the second one, then you probably hate kittens and sleep on broken glass.

Okay, our comments service is feeling pretty solid now that we have our tests in place. The last step is add a form so that users can actually leave a comment on a blog post.
