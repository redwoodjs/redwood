# What is Redwood?

*What follows is a high-level description of Redwood and how it works. If you want to get right to the meat and potatoes of building someting, skip ahead to [Chapter 1](../chapter1/prerequisites.md).*

Redwood is a React framework with lots pre-installed packages and configuration that makes it easy to build full-stack web applications.

Now that the elevator pitch is out of the way, what does that actually *mean*? At its core, Redwood is React plus a bunch of stuff that makes your life as a developer easier. Some of that stuff includes:

* GraphQL
* Prisma
* Jest
* Storybook
* vite
* Babel
* Typescript

What do we mean when we say a "full-stack web application?" We're talking about your classic web app: a UI that's visible in the browser (the frontend), backed by a server and database (the backend). Until React Server Components came along (more on those later) React had no idea a server and/or database existed: it was up to you to somehow get data into your app. Maybe this was done with a `fetch()` or in a build step which would pre-bake some of the data needed right into your components. However the data got there, it wasn't an ideal solution.

One of the core principals behind Redwood was that getting data from the backend should be as simple as possible, going so far as to create conventions around it so that retrieving data for display in a component was as easy as adding a couple of lines of code directly into the component itself. Oh and while we're at it, Redwood will automatically show a loading message while waiting for the data, a different state if there's an error, and even a separate message if the data returned from the server is empty (the classic "blank slate").

## How a Readwood App Works

A Redwood app is actually two apps: a frontend (that's the React part) and a backend, which is your server and talks to a database and other third party systems. Your app is technically a monorepo with two top-level directories: `web` containing the frontend code and `api` containing the backend.

You can start them both with a single command: `yarn rw dev`

## The Frontend

### The Router

When you open your web app in a browser, React does its thing initializing your app and monitoring the history for changes so that new content can be shown. Redwood features a custom, declaritive Router that lets you specify URLs and the requisite pages (just a React component) will be shown. A simple routes file may look something like:

```jsx
import { Set, Router, Route } from '@redwoodjs/router'
import ApplicationLayout from 'src/layouts/ApplicationLayout'
import { useAuth } from './auth'

const Routes = () => {
  return (
    <Router useAuth={useAuth}>
      <Set wrap={ApplicationLayout}>
        <Route path="/login" page={LoginPage} name="login" />
        <Route path="/signup" page={SignupPage} name="signup" />
        <Private unauthenticated="login">
          <Route path="/dashboard" page={DashboardPage} name="dashboard" />
        </Private>
      </Set>

      <Route path="/" page={HomePage} name="home" />
      <Route notfound page={NotFoundPage} />
    </Router>
  )
}
```

You can probably get a sense of how all of this works without ever having seen a Redwood route before! Some routes can be marked as `<Private>` and will not be accessible without being logged in. Others can be wrapped in a "layout" (again, just a React component) to provide common styling shared between pages in your app.

So browsing to `/` will load the `HomePage` page (component) which itself is just composed of more React components, nothing special there. But, what if the homepage displayed some testimonials from the database? Ahh, now things are getting interesting. Here's where Redwood's handpicked selection of technologies start to take the spotlight.

### GraphQL

Redwood uses GraphQL as the glue between the front- and backends: whenever you want data from the server/database, you're going to retrieve it via GraphQL. Now, we could have just given you raw access to some a GraphQL library and let you make those calls yourself. We use [Apollo Client](https://www.apollographql.com/apollo-client) on the frontend and Apollo provides hooks like `[useQuery()](https://www.apollographql.com/tutorials/lift-off-part1/10-the-usequery-hook)` and `[useMutation()](https://www.apollographql.com/tutorials/lift-off-part4/08-the-usemutation-hook)` to retrieve and set data, respectively. But Redwood has a much deeper integration.

What if you could have a component that was not only responsible for its own display *but even its own data retrieval*? Meaning everything that component needed in order to display itself, it could all be self-contained. That includes the code to display while the data is loading, or if something goes wrong. These kinds of uber-components Redwood calls "cells."

#### Cells

A cell is still just a React component (also called a [single file component](https://www.swyx.io/react-sfcs-here)), it just happens to follow a couple of conventions that make it work as described above:

1. The name of the file ends in `Cell"
2. The file exports several named components, at the very least one named `QUERY` and another named `Success`
3. The file can optionally export several other components, like `Loading`, `Failure` and `Empty`. You can probably guess what those are for!

So, any time React is about to render a cell, the following lifecycle occurs:

1. The `Loading` component is displayed
2. A `useQuery()` hook is fired, using the exported `QUERY`
3. Assuming the data returns successfully, the `Success` component is rendered with one of the props being the data returned from `useQuery()`
4. If something went wrong, `Failure` is rendered
5. If the query returned `null` or an empty array, the `Empty` component is rendered

Going back to our testimonals hypothetical, a cell to fetch and display them may look something like:

```js
export const QUERY = gql`
  query GetTestimonials {
    testimonals {
      id
      author
      quote
    }
  }
`

export const Loading = () => <div>Loading...</div>

export const Failure = ({ error }) => <div>An error occured!</div>

export const Success = ({ testimonials }) => {
  return (
    <ul>
      testimonials.map((test) => {
        <li>{test.quote} — {test.author}</li>
      })
    </ul>
  )
}
```

(In this case we don't export `Empty` so that if there aren't any, that section of the final page won't render anything, not even indicating to the user that something is missing.)

If you ever create additional clients for your server (a mobile app, perhaps) you'll be giving yourself a huge advantage by using GraphQL from the start.

#### Apollo Cache

The Apollo Client library also intelligently caches the results of that `QUERY` above, and so if the user browses away and returns to the homepage, the `Success` component is now rendered *immediately* from the cache! Simultaneously, the query is made to the server again to see if any data has changed since the cache was populated. If so, the new data is merged into the cache and the component will re-render to show any new testimonials since the last time it was viewed.

So, you get performance benefits of an instant display of cached data, but with the guarantee that you won't only see stale data: it's constantly being kept in sync with the latest from the server.

You can also directly manipulate the cache to add or remove entries, or even use it for [state management](https://www.apollographql.com/docs/react/local-state/local-state-management/).

If you're familiar with GraphQL then you know that on the backend you define the structure of data that GraphQL queries will return with "resolvers." But GraphQL itself doesn't know anything about talking to databases. How does the raw data in the database make it into those resolvers? That's where our next package comes in.

## The Backend

Now we're into the backend code in the `api` directory.

### Prisma

[Prisma](https://www.prisma.io/) is the package Redwood uses to talk to your database, and provides automated migrations, type-safety and auto-completion in your IDE. Your Redwood app will contain a file called `schema.prisma` that will reflect your current database schema:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider      = "prisma-client-js"
  binaryTargets = "native"
}

model Testimonial {
  id        Int       @id @default(autoincrement())
  author    String    @unique
  quote     String
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}
```

Prisma has a couple command line tools that take changes to this file and turn them into [SQL DDLcommands which are executed against your database to update its structure to match.

Redwood abstracts the concept of GraphQL resolver into a "service." You will generally start with one service function per GraphQL query/mutation. For example, going back to our testimonials example, you would have a service function named `testimonials()` that returns the data for the GraphQL query named `testimonials`. That function uses Prisma to query the database:

```js
import { db } from 'src/lib/db'

export const testimonials = () => {
  return db.testimonial.findMany()
}
```

How does GraphQL know to go here for its `testimonials` resolver? Redwood introduces an "sdl" file, which contains the mapping from GraphQL to the world of services:

```js
export const schema = gql`
  type User {
    id: Int!
    author: String!
    quote: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Query {
    testimonials: [Testimonial!] @skipAuth
  }
`
```

Any definitions listed in the `type Query` section are expected to have a service function with the same name: `testimonials` -> `testimonials()`

## Generators

Let's take a look at an often overlooked tool in many frameworks' kit: the command line tools. Redwood has focused extensively on these, and one the most powerful are the generators. These are used to create files, setup integrations, execute scripts, start the dev server, and more.

A huge timesaver is generating layouts, pages and cells. There isn't much boilerplate in Redwood's files, but it's still nice to have them built out for, even going so far as creating tests for the bare functionality (more on tests in a minute).

They also provide easy access to dev tools like Graphiql (for executing GraphQL functions against your server) and Prisma Studio (providing a full GUI for your database).

![image](https://github.com/redwoodjs/redwood/assets/300/18c928ff-aa34-4f06-941b-69c8035cee61)

![image](https://github.com/redwoodjs/redwood/assets/300/11f7553e-26a5-4a8f-b618-b9464828cafa)

Redwood has setup commands for UI libraries like [Tailwind](https://tailwindcss.com/) and [Mantine](https://mantine.dev/), and even provides access to experimental new features, making it easy to enable and disable them on the fly.

## Jest

Being able to develop a full-stack application this easily is great, but how do you verify that it's working as intended? That's where a great test suite comes in. [Jest](https://jestjs.io/) is a test framework that, as they say, focuses on simplicty. We felt that it was a natural fit with Redwood, and so most files you can generate will include the related test file automatically (pre-filled with some tests, even!).

Redwood includes several Jest helpers and matchers, allowing you to mock out GraphQL requests, database data, logged in users, and more.

![image](https://github.com/redwoodjs/redwood/assets/300/614d9867-9765-474f-8b8b-c9217f3f7dcf)

You can write Jest tests in both the front- and backend of your app.

## Storybook

While Jest can test your code, [Storybook](https://storybook.js.org/) can be used to catalog and test your UI. They call themselves a "frontend workshop for building UI components in isolation" and we couldn't agree more. Build your components separate from your app, even having props be dynamic while viewing their effects.

Redwood adds data mocking for Storybook so that you can display components that would normally be populated with data from GraphQL, but without even needing a server running.

![image](https://github.com/redwoodjs/redwood/assets/300/2753a292-01d4-41b9-9975-edc1f8c1c3ac)

Storybook is strictly a frontend codebase concern.

## vite, Babel and Typescript

Notice at no point above did we say "and then we need to write configuration for this package..." Redwood has done all of that for you. We're sure you won't miss spending hours or days trying to add and configure a package in your application. You can eject from our default configs, and add custom code if needed, but most apps will never need to do this: everything Just Works.

We use vite as our bundler, packaging up the frontend code and automatically code splitting on pages.

The entire framework is typed and so you can autocomplete all the things in your IDE.

## Coming Soon

Redwood is still in active development, and we're working on some features that are on the cutting edge of the React ecosystem:

* React Server Components
* Suspense and Streaming
* GraphQL Realtime and Subscriptions
* Fastify

## Backing

Redwood was created by Tom Preston-Werner, cofounder of GitHub and projects like Semantic Versioning, TOML, Jekyll, and many more. Tom believes that Javascript applications, specifically full-stack JS applications, are the future of the web, and Redwood has his full support.

## Updates

Redwood is constantly being updated and sticks strictly to semantic versioning requirements. You can be sure that there won't be any sudden, breaking changes without a major version revision. Redwood is famous for its [copious release notes](https://community.redwoodjs.com/t/redwood-3-0-0-is-now-available/3989), and if code changes need to be made to your app, we make every effort to include a codemod script that will make the changes for you.

## Community

There's a very active community around Redwood, including a [Discourse forum](https://community.redwoodjs.com/) and [Discord chat](https://discord.gg/redwoodjs), where even members of the core team can be found answering questions. We're building this framework for users like you, and we need your feedback if we're going to be successful!
