# Connection Pooling

Production Redwood apps should enable connection pooling in order to properly scale with your Serverless functions.

## Heroku
For Postgres, see [Postgres Connection Pooling](https://devcenter.heroku.com/articles/postgres-connection-pooling).

Heroku does not officially support MySQL.


## Digital Ocean
For Postgres, see [How to Manage Connection Pools](https://www.digitalocean.com/docs/databases/postgresql/how-to/manage-connection-pools)

Connection Pooling for MySQL is not yet supported.

## AWS
Use [Amazon RDS Proxy](https://aws.amazon.com/rds/proxy) for MySQL or PostgreSQL.


## Why Connection Pooling?

Relational databases have a maximum number of concurrent client connections.

* Postgres allows 100 by default
* MySQL allows 151 by default

In a traditional server environment, you would need a large amount of traffic (and therefore web servers) to exhaust these connections, since each web server instance typically leverages a single connection.

In a Serverless environment, each function connects directly to the database, which can exhaust limits quickly. To prevent connection errors, you should add a connection pooling service in front of your database. Think of it as a load balancer.
