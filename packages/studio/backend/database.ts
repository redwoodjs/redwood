import path from 'path'

import { open } from 'sqlite'
import type { Database } from 'sqlite'
import sqlite3 from 'sqlite3'

import { getPaths, getConfig } from '@redwoodjs/project-config'

let db: Database<sqlite3.Database, sqlite3.Statement>

export const getDatabase = async () => {
  // Switch between in-memory and file-based database based on toml config
  const filename = getConfig().experimental.studio.inMemory
    ? ':memory:'
    : path.join(getPaths().generated.base, 'studio.db')

  if (db === undefined) {
    db = await open({
      filename,
      driver: sqlite3.Database,
    })
  }
  return db
}
