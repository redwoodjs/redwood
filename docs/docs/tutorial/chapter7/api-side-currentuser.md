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
  roles               String @default("moderator")
  // highlight-next-line
  posts               Post[]
}
```

### Migrate the Database

Next, migrate the database to apply the changes (when given the option, name the migration something like "add userId to post"):

```
yarn rw prisma migrate dev
```

Whoops!

<img width="584" alt="image" src="https://user-images.githubusercontent.com/300/192899337-9cc1167b-e6da-42d4-83dc-d2a6c0cd1179.png" />

We made `userId` a required field, but we already have several posts in our development database! Since we don't have a default value for `userId` defined, it's impossible to add this column to the database.

:::caution Why don't we just set `@default(1)` in the schema?

This would get us past this problem, but could cause hard-to-track-down bugs in the future: if you ever forget to assign a `post` to a `user`, rather than fail it'll happily just set `userId` to `1`, which may or may not even exist at some day! It's best to take the extra time to do things The Right Way and avoid the quick hacks to get past an annoyance like this. Your future self will thank you!

:::

Since we're in development, let's just blow away the database and start over:

```
yarn rw prisma migrate reset
```

:::info Database Seeds

If you started the second half the tutorial from the [Redwood Tutorial repo](https://github.com/redwoodjs/redwood-tutorial) you'll get an error after resetting the database—Prisma attempts to seed the database with a user and some posts to get you started, but the posts in that seed do not have the new required `userId` field! Open up `scripts/seed.js` and edit each post to add `userId: 1` to each:

```javascript title="scripts/seed.js"
{
  id: 1,
  title: 'Welcome to the blog!',
  body:
    "I'm baby single- origin coffee kickstarter lo - fi paleo skateboard.Tumblr hashtag austin whatever DIY plaid knausgaard fanny pack messenger bag blog next level woke.Ethical bitters fixie freegan,helvetica pitchfork 90's tbh chillwave mustache godard subway tile ramps art party. Hammock sustainable twee yr bushwick disrupt unicorn, before they sold out direct trade chicharrones etsy polaroid hoodie. Gentrify offal hoodie fingerstache.",
  // highlight-next-line
  userId: 1,
},
```

Now run `yarn rw prisma migrate reset` again and you should be good.

:::

If you didn't start your codebase from the Redwood Tutorial repo then you'll now have no users or posts in the database. Go ahead and create a user by going to http://localhost:8910/signup but don't create any posts yet! Change their role to be "admin", either by using the console introduced in the [previous tutorial page](http://localhost:3000/docs/canary/tutorial/chapter7/rbac#changing-roles-on-a-user) or by [opening Prisma Studio](/docs/canary/tutorial/chapter2/getting-dynamic#prisma-studio) and changing it directly in the database.

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

:::info What about the mutations?

We did *not* add `user` or `userId` to the `CreatePostInput` or `UpdatePostInput` types. Although we want to set a user on each newly created post, we don't want just anyone to do that via a GraphQL call! You could easily create or edit a post and assign it to someone else. We'll save assigning the user to just the service, so it can't be manipulated by the outside world.

:::

Here we're using `User!` with an exclamation point because we know that every `Post` will have an associated user to it—this field will never be `null`.

#### Add User Field Resolver

This one is a little tricker: we need to add a "lookup" in the `posts` service, so that it knows how to get the associated user. When we generated the `comments` SDL and service we got this field resolver created for us. We could re-run the service generator for `Post` but that could blow away changes we made to this file. Our only option would be to include the `--force` flag since the file already exists, which will write over every thing. In this case we'll just add the field resolver manually:

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

That post will already be retreived from the database, and so we know its `id`. `root` is that object, so can simply call `.id` on it to get that property. Finally we perform a `findOne()` query in Prisma, giving it the `id` of the record we already found, but return the `user` associated to that record, rather than the `post` itself.

Note that if you kep the field resolver above, but also included a `user` property in the post(s) returned from `posts` and `post`, this field resolver will still be invoked and whatever is returned will override any `user` property that exists already. Why? That's just how GraphQL works!

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

## Displaying the Author

In order to get the author info we'll need to update our Cell queries to pull the user's name.

There are two places where we publicly present a post:

1. The homepage
2. A single article page

Let's update their respective Cells to include the name of the user that created the post:

```jsx title="web/src/components/ArticlesCell/ArticlesCell.js
export const QUERY = gql`
  query ArticlesQuery {
    articles: posts {
      id
      title
      body
      createdAt
      // highlight-start
      user {
        name
      }
      // highlight-end
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
      // highlight-start
      user {
        name
      }
      // highlight-end
    }
  }
`
```

And then update the display component that shows an Article:

```jsx title="web/src/components/Article/Article.js
import { Link, routes } from '@redwoodjs/router'

const Article = ({ article }) => {
  return (
    <article>
      <header>
        <h2 className="text-xl text-blue-700 font-semibold">
          <Link to={routes.article({ id: article.id })}>{article.title}</Link>
          // highlight-start
          <span className="ml-2 text-gray-400 font-normal">
            by {article.user.name}
          </span>
          // highlight-end
        </h2>
      </header>

      <div className="mt-2 text-gray-900 font-light">{article.body}</div>
    </article>
  )
}

export default Article
```

Depending on whether you started from the Redwood Tutorial repo or not, you may not have any posts to actually display. Let's add some! However, before we can do that with our posts admin/scaffold, we'll need to actaully associate a user to the post they created. Remember that we don't allow setting the `userId` via GraphQL, which is what the scaffolds use when creating/editing records. But that's okay, we want this to only happen in the service anyway, which is where we're heading now.

## Accessing `currentUser` on the API side

There's a magical variable named `context` that's available within any of your service functions. We'll use that to access `currentUser` (the same `currentUser` that you can access form the web side.

```javascript title="api/src/service/posts/posts.js
export const createPost = ({ input }) => {
  return db.post.create({
    // highlight-next-line
    data: { ...input, userId: context.currentUser.id }
  })
}
```

So `context.currentUser` will always be around if you need access to the user that made this request. We'll take their user `id` and appened it the rest of the data coming in from the scaffold form. Let's try it out!

You should be able to create a post via the admin now:

<img width="937" alt="image" src="https://user-images.githubusercontent.com/300/193152401-d98b488e-dd71-475a-a78c-6cd5233e5bee.png" />

And going back to the hompage should actually start showing posts and their authors!

<img width="937" alt="image" src="https://user-images.githubusercontent.com/300/193152524-2715e49d-a1c3-43a1-b968-84a4f8ae3846.png" />

## Only Show a User Their Posts in Admin

Right now any admin that visits `/admin/posts` can still see all posts, not only their own. Let's change that.

Since we now know we have access to `context.currentUser` we can sprinkle it throughout our posts service to limit what's returned to only those posts that the currently logged in user owns:

```javascript title="api/src/services/posts/posts.js"
import { db } from 'src/lib/db'

export const posts = () => {
  // highlight-next-line
  return db.post.findMany({ where: { userId: context.currentUser.id } })
}

export const post = ({ id }) => {
  return db.post.findUnique({
    // highlight-next-line
    where: { id, userId: context.currentUser.id },
  })
}

export const createPost = ({ input }) => {
  return db.post.create({
    data: { ...input, userId: context.currentUser.id },
  })
}

export const updatePost = ({ id, input }) => {
  return db.post.update({
    data: input,
    // highlight-next-line
    where: { id, userId: context.currentUser.id },
  })
}

export const deletePost = ({ id }) => {
  return db.post.delete({
    // highlight-next-line
    where: { id, userId: context.currentUser.id },
  })
}

export const Post = {
  user: (_obj, { root }) =>
    db.post.findFirst({ where: { id: root.id } }).user(),
}
```

These changes make sure that user can only see a list of their own posts, edit their own post, or delete their own post.

We can verify this by signing up as a new user, changing their role to "admin" (remember that only users with that role can access the admin pages after the [RBAC](/docs/tutorial/chapter7/rbac) section) and then creating a post as that new user. Your lists of posts should only show the newly created one, and if you log out and back in as your original user you should only see your previously created post(s).
