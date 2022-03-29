# Connection Pooling

If you're deploying to a serverless environment, you should use connection pooling to scale properly.

Relational databases have a maximum number of concurrent client connections.
For example, Postgres allows 100 by default, and MySQL allows 151.

In a traditional serverful environment, you'd need a lot of traffic—and therefore, web servers—to exhaust these limits, since each web server instance typically leverages a single connection.
But in a serverless environment, each function connects to the database directly, which can exhaust these limits quickly.

To prevent connection errors, you should add a connection pooling service in front of your database.
Think of it as a load balancer.

## Prisma Pooling with PgBouncer

PgBouncer holds a connection pool to the database and proxies incoming client connections by sitting between Prisma Client and the database. This reduces the number of processes a database has to handle at any given time. PgBouncer passes on a limited number of connections to the database and queues additional connections for delivery when space becomes available.


To use Prisma Client with PgBouncer from a serverless function, add the `?pgbouncer=true` flag to the PostgreSQL connection URL:

```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE?pgbouncer=true
```

Typically, your PgBouncer port will be `6543` which is different than the Postgres default of `5432`.

> Note that since Prisma Migrate uses database transactions to check out the current state of the database and the migrations table, if you attempt to run Prisma Migrate commands in any environment that uses PgBouncer for connection pooling, you might see an error.
>
> To work around this issue, you must connect directly to the database rather than going through PgBouncer when migrating.

For more on Prisma and PgBouncer, refer to Prisma's Guide on [Configuring Prisma Client with PgBouncer](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management/configure-pg-bouncer).

## Supabase

For Postgres running on [Supabase](https://supabase.io) see: [PgBouncer is now available in Supabase](https://supabase.io/blog/2021/04/02/supabase-pgbouncer#using-connection-pooling-in-supabase).

All new Supabase projects include connection pooling using [PgBouncer](https://www.pgbouncer.org/).

We recommend that you connect to your Supabase Postgres instance using SSL which you can do by setting `sslmode` to `require` on the connection string:

```
// not pooled typically uses port 5432
postgresql://postgres:mydb.supabase.co:5432/postgres?sslmode=require
// pooled typically uses port 6543
postgresql://postgres:mydb.supabase.co:6543/postgres?sslmode=require&pgbouncer=true
```

## Heroku

For Postgres, see [Postgres Connection Pooling](https://devcenter.heroku.com/articles/postgres-connection-pooling).

Heroku does not officially support MySQL.

## Digital Ocean

For Postgres, see [How to Manage Connection Pools](https://www.digitalocean.com/docs/databases/postgresql/how-to/manage-connection-pools)

Connection Pooling for MySQL is not yet supported.

## AWS

Use [Amazon RDS Proxy](https://aws.amazon.com/rds/proxy) for MySQL or PostgreSQL.

From the [AWS Docs](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/rds-proxy.html#rds-proxy.limitations):

> Your RDS Proxy must be in the same VPC as the database. The proxy can't be publicly accessible.

Because of this limitation, with out-of-the-box configuration, you can only use RDS Proxy if you're deploying your Lambda Functions to the same AWS account. Alternatively, you can use RDS directly, but you might require larger instances to handle your production traffic and the number of concurrent connections.
