import type { Database } from 'sqlite'
import sqlite3 from 'sqlite3'

import { getDatabase } from './database'

export async function runMigrations() {
  const db = await getDatabase()

  await setupTables(db)
  await setupViews(db)

  // span type and brief
  await migrate000(db)

  // initial mail table
  await migrate001(db)

  //
}

async function migrate000(db: Database<sqlite3.Database, sqlite3.Statement>) {
  const user_version = (await db.get(`PRAGMA user_version;`))['user_version']
  if (user_version !== 0) {
    return
  }

  // NOTE: PRAGMA user_version does not support prepared statement variables
  const sql = `
    BEGIN TRANSACTION;
      ALTER TABLE span ADD COLUMN type TEXT(255) DEFAULT NULL;
      ALTER TABLE span ADD COLUMN brief TEXT(255) DEFAULT NULL;
      PRAGMA user_version = ${user_version + 1};
    COMMIT;
  `
  await db.exec(sql)
}

async function migrate001(db: Database<sqlite3.Database, sqlite3.Statement>) {
  const user_version = (await db.get(`PRAGMA user_version;`))['user_version']
  if (user_version !== 1) {
    return
  }

  // NOTE: PRAGMA user_version does not support variables
  const sql = `
    BEGIN TRANSACTION;
      CREATE TABLE IF NOT EXISTS mail (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        data JSON,
        envelope JSON,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      );
      CREATE TABLE IF NOT EXISTS mail_template (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        path TEXT UNIQUE,
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      );
      CREATE TABLE IF NOT EXISTS mail_template_component (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mail_template_id INTEGER NOT NULL,
        name TEXT NOT NULL UNIQUE,
        props_template TEXT,
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      );
      CREATE TABLE IF NOT EXISTS mail_renderer (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        is_default INTEGER DEFAULT 0,
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      );
      PRAGMA user_version = ${user_version + 1};
    COMMIT;
  `
  await db.exec(sql)
}

const setupTables = async (
  db: Database<sqlite3.Database, sqlite3.Statement>
) => {
  // BIGINT for UnixNano times will break in 239 years (Fri Apr 11 2262 23:47:16 GMT+0000)
  const spanTableSQL = `
  CREATE TABLE IF NOT EXISTS
    span (
      id TEXT PRIMARY KEY,
      trace TEXT NOT NULL,
      parent TEXT,
      name TEXT,
      kind INTEGER,
      status_code INTEGER,
      status_message TEXT,
      start_nano BIGINT,
      end_nano BIGINT,
      duration_nano BIGINT,
      events JSON,
      attributes JSON,
      resources JSON
    );
  `
  await db.exec(spanTableSQL)
}

const setupViews = async (
  db: Database<sqlite3.Database, sqlite3.Statement>
) => {
  const prismaQueriesView = `
  CREATE VIEW IF NOT EXISTS prisma_queries as SELECT DISTINCT
    s.id,
    s.trace,
    s.parent as parent_id,
    p.trace as parent_trace,
    s.name,
    json_extract(p. "attributes", '$.method') AS method,
    json_extract(p. "attributes", '$.model') AS model,
    json_extract(p. "attributes", '$.name') AS prisma_name,
    s.start_nano,
    s.end_nano,
    s.duration_nano,
    cast((s.duration_nano / 1000000.000) as REAL) as duration_ms,
    cast((s.duration_nano / 1000000000.0000) as number) as duration_sec,
    json_extract(s. "attributes", '$."db.statement"') AS db_statement
    FROM
    span s
    JOIN span p ON s.trace = p.trace
    WHERE
    s. "name" = 'prisma:engine:db_query'
      AND
      p. "name" = 'prisma:client:operation'
    ORDER BY s.start_nano desc, s.parent;
`
  await db.exec(prismaQueriesView)

  const SQLSpansView = `
  CREATE VIEW IF NOT EXISTS sql_spans AS
  SELECT DISTINCT
    *,
    cast((duration_nano / 1000000.000) as REAL) as duration_ms,
    cast((duration_nano / 1000000000.0000) as number) as duration_sec
    FROM
    span
    WHERE
    json_extract(attributes, '$."db.statement"') IS NOT NULL
    ORDER BY start_nano desc;
`
  await db.exec(SQLSpansView)

  const graphQLSpansView = `CREATE VIEW IF NOT EXISTS graphql_spans AS
    SELECT
      id,
      parent,
      name,
      json_extract(ATTRIBUTES, '$."graphql.resolver.fieldName"') AS field_name,
      json_extract(ATTRIBUTES, '$."graphql.resolver.typeName"') AS type_name,
      start_nano,
      end_nano,
      duration_nano
    FROM
      span
    WHERE
      field_name IS NOT NULL
      OR type_name IS NOT NULL
    ORDER BY
      start_nano DESC;`

  await db.exec(graphQLSpansView)
}
