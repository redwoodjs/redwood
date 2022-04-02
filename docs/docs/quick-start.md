---
sidebar_position: 2
---

# Quick Start

> **Prerequisites**
>
> - Redwood requires [Node.js](https://nodejs.org/en/) (>=14.19.x <=16.x) and [Yarn](https://classic.yarnpkg.com/en/docs/install/) (>=1.15):
> ```
> node --version
> yarn --version
> ```
>
> - Are you on Windows? For best results, follow our [Windows development setup](how-to/windows-development-setup.md) guide.

Create a Redwood project with `yarn create redwood-app`:

```
yarn create redwood-app my-redwood-project
```

> **Prefer TypeScript?**
>
> Redwood comes with full TypeScript support from the get-go:
>
> ```
> yarn create redwood-app my-redwood-project --typescript
> ```

Then change into that directory and start the development server:

```
cd redwoodblog
yarn redwood dev
```

Your browser should automatically open to [http://localhost:8910](http://localhost:8910) where you'll see the Redwood welcome page:

<img data-mode="light" src="https://user-images.githubusercontent.com/300/145314717-431cdb7a-1c45-4aca-9bbc-74df4f05cc3b.png" alt="Redwood Welcome Page" style={{ marginBottom: 20 }} />

<img data-mode="dark" src="https://user-images.githubusercontent.com/32992335/161387013-2fc6702c-dfd8-4afe-aa2f-9b06d575ba82.png" alt="Redwood Welcome Page" style={{ marginBottom: 20 }} />

> **Not a fan of automatic browser opening?**
>
> You can disable it in the `redwood.toml`:
>
> ```diff title="redwood.toml"
>  [browser]
> -  open = true
> +  open = false
> ```

The welcome page links out to a ton of great resources.

## The database

Redwood wouldn't be a full-stack framework without a database.
It all starts with the schema.
Open the `schema.prisma` file and replace the `UserExample` model with the following `Post` model:

```js title="api/db/schema.prisma"
model Post {
  id        Int      @id @default(autoincrement())
  title     String
  body      String
  createdAt DateTime @default(now())
}
```

Redwood uses [Prisma](https://www.prisma.io/), a next-gen Node.js and TypeScript ORM, to talk to the database.
Prisma has a feature called [Migrate](https://www.prisma.io/migrate) that makes database migrations hassle free:

```
yarn rw prisma migrate dev
```

> `rw` is short for `redwood`

You'll be prompted for the name of your migration.
`create posts` will do.

Now let's generate everything we need to perform all the CRUD (Create, Retrieve, Update, Delete) actions on our `Post` model:

```
yarn redwood g scaffold userExample
```

Navigate to [http://localhost:8910/posts/new](http://localhost:8910/posts/new), fill in the title and body, and click "Save":

<img src="https://user-images.githubusercontent.com/300/73028004-72262c00-3de9-11ea-8924-66d1cc1fceb6.png" alt="Create a new post" />

Did we just create a post in the database? Yup!
With `yarn rw g scaffold <model>`, Redwood created all the pages, components, and services necessary to perform all CRUD actions on our posts table.

## Next Steps

The best way to get to know Redwood is by going through the comprehensive [Tutorial](tutorial/foreword.md) and joining the community (via the [Discourse forum](https://community.redwoodjs.com) or the [Discord server](https://discord.gg/redwoodjs)).
