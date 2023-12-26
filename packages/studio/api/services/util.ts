import { getDatabase } from '../database'

import { restructureSpan } from './span'

async function getAncestorSpanIDs(spanId: string): Promise<string[]> {
  // Note: generated with GPT because I am not a SQL expert
  const query = `
    WITH RECURSIVE span_hierarchy AS (
      SELECT id, parent
      FROM span
      WHERE id = ?
      UNION ALL
      SELECT s.id, s.parent
      FROM span s
      JOIN span_hierarchy sh ON s.id = sh.parent
    )
    SELECT id, parent
    FROM span_hierarchy;
  `

  const db = await getDatabase()
  const stmt = await db.prepare(query, spanId)
  const result = await stmt.all()
  await stmt.finalize()

  // Remove the span itself from the result
  return result.map((row) => row.id).filter((id) => id !== spanId)
}

export async function getAncestorSpans(spanId: string): Promise<any[]> {
  const ancestorSpanIDs = await getAncestorSpanIDs(spanId)
  const db = await getDatabase()
  const stmt = await db.prepare(
    `SELECT * FROM span WHERE id IN (${ancestorSpanIDs
      .map(() => '?')
      .join(', ')});`
  )
  const result = await stmt.all(...ancestorSpanIDs)
  await stmt.finalize()
  return result.map((span) => restructureSpan(span))
}

async function getDescendantSpanIDs(spanId: string): Promise<string[]> {
  // Note: generated with GPT because I am not a SQL expert
  const query = `
    WITH RECURSIVE span_hierarchy AS (
      SELECT id, parent
      FROM span
      WHERE id = ?
      UNION ALL
      SELECT s.id, s.parent
      FROM span s
      JOIN span_hierarchy sh ON s.parent = sh.id
    )
    SELECT id, parent
    FROM span_hierarchy;
  `

  const db = await getDatabase()
  const stmt = await db.prepare(query, spanId)
  const result = await stmt.all()
  await stmt.finalize()

  // Remove the span itself from the result
  return result.map((row) => row.id).filter((id) => id !== spanId)
}

export async function getDescendantSpans(spanId: string): Promise<any[]> {
  const descendantSpanIDs = await getDescendantSpanIDs(spanId)
  const db = await getDatabase()
  const stmt = await db.prepare(
    `SELECT * FROM span WHERE id IN (${descendantSpanIDs
      .map(() => '?')
      .join(', ')});`
  )
  const result = await stmt.all(...descendantSpanIDs)
  await stmt.finalize()
  return result.map((span) => restructureSpan(span))
}

export async function getChildSpans(spanId: string): Promise<any[]> {
  const db = await getDatabase()
  const stmt = await db.prepare('SELECT * FROM span WHERE parent=?;')
  const result = await stmt.all(spanId)
  await stmt.finalize()
  return result
}

export async function getSpan(spanId: string): Promise<any> {
  const db = await getDatabase()
  const stmt = await db.prepare('SELECT * FROM span WHERE id=?;')
  const result = await stmt.get(spanId)
  await stmt.finalize()
  return result
}
