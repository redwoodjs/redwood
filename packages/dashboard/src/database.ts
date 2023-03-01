import { open } from 'sqlite'
import type { Database } from 'sqlite'
import sqlite3 from 'sqlite3'

let db: Database<sqlite3.Database, sqlite3.Statement>

export const getDatabase = async () => {
  if (db === undefined) {
    db = await open({
      filename: ':memory:',
      driver: sqlite3.Database,
    })
  }
  return db
}

export const setupTables = async () => {
  const db = await getDatabase()

  // BIGINT for UnixNano times will break in 239 years (Fri Apr 11 2262 23:47:16 GMT+0000)
  const spanTableSQL = `CREATE TABLE span (id TEXT PRIMARY KEY, trace TEXT NOT NULL, parent TEXT, name TEXT, kind INTEGER, status_code INTEGER, status_message TEXT, start_nano BIGINT, end_nano BIGINT, duration_nano BIGINT, events JSON, attributes JSON, resources, JSON);`
  await db.exec(spanTableSQL)
}
