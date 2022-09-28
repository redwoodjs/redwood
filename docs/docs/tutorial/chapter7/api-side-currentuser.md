# Accessing currentUser in Services

As our blog has evolved into a multi-million dollar enterprise, we find ourselves so busy counting our money that we don't have time to write actual blog posts! Let's hire some authors to write them for us.

What do we need to change to allow multiple users to create posts? Well, for one, we'll need to start associating a blog post to the author that wrote it so we can give them credit. In addition, we'll want to limit the list of blog posts that an author has access to edit to only their own: Alice shouldn't be able to make changes to Bob's articles.

## Associating a Post to a User

Let's introduce a relationship between a `Post` and a `User`, AKA a foreign key. This is considered a one-to-many relationship (one `User` has many `Post`s), similar to the relationship between a `Post` and its `Comment`s:

```
┌─────────────────────┐       ┌───────────┐
│        User         │       │  Post     │
├─────────────────────┤       ├───────────┤
│ id                  │───┐   │ id        │
│ name                │   │   │ title     │
│ email               │   │   │ body      │
│ hashedPassword      │   └──<│ userId    │
│ salt                │       │ createdAt │
│ resetToken          │       └───────────┘
│ resetTokenExpiresAt │
└─────────────────────┘
```

Making data changes like this will start becoming second nature soon:

1. Add the new relationship the schema
2. Migrate the database
3. Generate/update SDLs and Services

### Add the New Relationship to the Schema

First we'll add the new `userId` field to `Post` and the relation to `User`:

```javascript title="api/db/schema.prisma"
model Post {
  id        Int      @id @default(autoincrement())
  title     String
  body      String
  comments  Comment[]
  // highlight-start
  user      User     @relation(fields: [userId], references: [id])
  userId    Int
  // highlight-end
  createdAt DateTime @default(now())
}

model User {
  id                  Int @id @default(autoincrement())
  name                String?
  email               String @unique
  hashedPassword      String
  salt                String
  resetToken          String?
  resetTokenExpiresAt DateTime?
  // highlight-next-line
  posts               Post[]
}
```

### Migrate the Database

Next, migrate the database to apply the changes:

```
yarn rw prisma migrate dev
```

Whoops!

<img width="584" alt="image" src="https://user-images.githubusercontent.com/300/192899337-9cc1167b-e6da-42d4-83dc-d2a6c0cd1179.png">

We made `userId` a required field, but we already have several posts in our development database! Without setting a default value for `userId` we're stuck.

::: caution Why don't I just set a default of `userId = 1`?

This would get us past this problem, but could cause hard-to-track-down bugs in the future: if you ever forget to assign a `post` to a `user`, rather than fail it'll happily just set `userId` to `1`, which may or may not even exist at some point in the future! It's best to things The Right Way and avoid the quick hacks to get past an annoyance like this. Your future self will thank you!

:::

Since we're in development, let's just blow away the database and start over:

```
yarn rw prisma migrate reset
```

You can name the migration something like "add userId to post".

### Add Fields to the SDL and Service

Let's think about where we want to show our new relationship. For now, probably just on the homepage and article page, we'll display the author of the post underneath the title. That means we'll want to access the user from the post, in a GraphQL query something like this:

```graphql
post {
  id
  title
  body
  createdAt
  user {
    name
  }
}
```

To enable this we'll need to make two modifications on the api side:

1. Add the `user` field to the `posts` SDL
2. Add a field resolver for the `user` in the `posts` service

#### Add User to Posts SDL

```javascript title="api/src/graphql/posts.sdl.js
  type Post {
    id: Int!
    title: String!
    body: String!
    createdAt: DateTime!
    // highlight-next-line
    user: User!
  }
```

Here we're using `User!` with an exclamation point because we know that every `Post` will have an associated user to it—this field will never be `null`.

#### Add User Field Resolver

This one is a little tricker: we need to add a "lookup" in the `posts` service, so that it knows how to get the associated user. When we generated the `Comment` SDL and service we got this field resolver created for us. We could re-run the service generator for `Post` but that could blow away changes we made to this file. Our only option would be to include the `--force` flag since the file already exists, which will write over every thing. In this case we'll just add the field resolver manually:

```javascript title="api/src/services/posts/posts.js"
import { db } from 'src/lib/db'

export const posts = () => {
  return db.post.findMany()
}

export const post = ({ id }) => {
  return db.post.findUnique({
    where: { id },
  })
}

export const createPost = ({ input }) => {
  return db.post.create({
    data: input,
  })
}

export const updatePost = ({ id, input }) => {
  return db.post.update({
    data: input,
    where: { id },
  })
}

export const deletePost = ({ id }) => {
  return db.post.delete({
    where: { id },
  })
}

// highlight-start
export const Post = {
  user: (_obj, { root }) =>
    db.post.findOne({ where: { id: root.id } }).user(),
}
// highlight-end
```

This can be non-intuitive so let's step through it. First, declare a variable with the same name as the model this service is for: `Post` for the `posts` service. Now, set that to an object containing keys that are the same as the fields that are going to be looked up, in this case `user`. When GraphQL invokes this function it passes a couple of arguments, one of which is `root` which is the object that was resolved to start with, in this case the `post` in our GraphQL query:

```graphql
post {
  id
  title
  body
  createdAt
  user {
    name
  }
}
```

That post will already be retreived from the database, and so we know its ID. `root` is that object, so can simply call `.id` on it to get that property. Finally we perform a `findOne()` query in Prisma, giving it the `id` of the record we already found, but return the `user` associated to that record, rather than the `post` itself.

:::info Prisma and the N+1 Problem

If you have any experience with database design and retrieval you may have noticed this method presents a less than ideal solution: for every post that's found, you need to perform an *additional* query just to get the user data associated with that `post`, also known as the [N+1 problem](https://medium.com/the-marcy-lab-school/what-is-the-n-1-problem-in-graphql-dd4921cb3c1a). This is just due to the nature of GraphQL queries: each resolver function really only knows about its own parent object, nothing about potential children.

There have been several attempts to work around this issue. A simple one that includes no extra dependencies is to remove this field resolver and simply include `user` data along with any `post` you retrieve from the database:

```javascript
export const post = ({ id }) => {
  return db.post.findUnique({
    where: { id },
    include: {
      user: true
    }
  })
}
```

This may or may not work for you: you are incurring the overhead of always returning user data, even if that data wasn't requested in the GraphQL query. In addition, this breaks further nesting of queries: waht if you wanted to return the user for this post, and a list of all the other posts IDs that they created?

```graphql
post {
  id
  title
  body
  createdAt
  user {
    name
    posts {
      id
    }
  }
}
```

This query would now fail because you only have `post.user` available, not `post.user.posts`.

The Redwood team is actively looking into more elegant built-in solutions to the N+1 problem, so stay tuned!

:::

### Updating the DB Data

If your dev server is running, you may have noticed that the browser is erroring: we haven't associated any posts to any users yet (and the SDL said there would always be one!). Let's update those now. The quickest way would probably be to open a GUI to the database and just manually set the `userId`. Prisma Studio to the rescue!

```
yarn rw prisma studio
```

A new browser should open to [http://localhost:5555](http://localhost:5555) and we make those changes:

### Update GraphQL Queries

There are two places where we publiclly present a list of users:

1. The homepage
2. A single article page

Let's update their respective Cells to include the name of the user that created the post.

```jsx title="web/src/components/ArticlesCell/ArticlesCell.js
export const QUERY = gql`
  query ArticlesQuery {
    articles: posts {
      id
      title
      body
      createdAt
      user {
        name
      }
    }
  }
`
```

```jsx title="web/src/components/ArticleCell/ArticleCell.js
export const QUERY = gql`
  query ArticleQuery($id: Int!) {
    article: post(id: $id) {
      id
      title
      body
      createdAt
      user {
        name
      }
    }
  }
`
```
