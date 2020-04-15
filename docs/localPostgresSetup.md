# Local Postgres Setup

RedwoodJS uses a SQLite database by default. While SQLite makes local development easy, you're
likely going to want to run the same database setup you use on production. Here's how to set up
Postgres.

## Install Postgres

Ensure you have Postgres installed and running on your machine. If you're on a Mac, we recommend
Homebrew:

```bash
brew install postgres
```

Follow the instructions provided. If you're using another platform, See
[postgresql.org/download](https://www.postgresql.org/download/).

## Update the Prisma Schema

Tell Prisma to use a Postgres database instead of SQLite by updating the `provider` attribute in your
`schema.prisma` file:

```prisma
// prisma/schema.prisma
datasource DS {
  provider = "postgres"
  url = env("DATABASE_URL")
}
```

Add a `DATABASE_URL` to your `.env` file with the URL of the database you'd like to use locally. The
following example uses `redwoodblog_dev` for the database. It also has `postgres` setup as a
superuser for ease of use.

```env
DATABASE_URL="postgresql://postgres@localhost/redwoodblog_dev?connection_limit=1"
```

Note the `connection_limit` parameter. This is [recommended by Prisma](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/deployment#recommended-connection-limit) when working with
relational databases in a Serverless context. You should also append this parameter to your production
`DATABASE_URL` when configuring your deployments.

If you've already created migrations using SQLite, you just need to run migrations again:

```bash
yarn rw db up
```

If you haven't created migrations yet, use `save`:

```bash
yarn rw db save
```

Both commands will create and migrate the Postres database you specified in your `.env`.
