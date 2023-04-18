import { getDatabase } from '../database'

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
  return result
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
  return result
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

export async function getSpanFeature(spanId: string): Promise<any> {
  return extractFeatureFromSpan(await getSpan(spanId))
}

export async function getTraceFeatures(traceId: string): Promise<any[]> {
  const db = await getDatabase()
  const stmt = await db.prepare(`SELECT *  FROM span WHERE trace = ?;`)
  const result = await stmt.all(traceId)
  await stmt.finalize()
  const features = []
  for (const span of result) {
    const feature = extractFeatureFromSpan(span)
    if (feature) {
      features.push(feature)
    }
  }
  return features
}

export async function getFeaturesFromAncestors(spanId: string): Promise<any[]> {
  const ancestorSpans = await getAncestorSpans(spanId)
  const features = []
  for (const span of ancestorSpans) {
    const feature = extractFeatureFromSpan(span)
    if (feature) {
      features.push(feature)
    }
  }
  return features
}

export async function getFeaturesFromDescendants(
  spanId: string
): Promise<any[]> {
  const descendantSpans = await getDescendantSpans(spanId)
  const features = []
  for (const span of descendantSpans) {
    const feature = extractFeatureFromSpan(span)
    if (feature) {
      features.push(feature)
    }
  }
  return features
}

export async function getSpanType(spanId: string) {
  return (await getSpan(spanId)).type
}

function extractFeatureFromSpan(span: any) {
  return {
    id: span.id,
    type: span.type,
    brief: span.brief,
  }
}

// export function determineSpanType(span: any): SpanType {
//   const attributes = JSON.parse(span.attributes)

//   // HTTP Requests
//   if (attributes['http.method'] !== undefined) {
//     return 'http'
//   }

//   // GraphQL Requests
//   // TODO: "graphql.execute.*" is not in the OTEL spec but is what the plugin uses - should move the plugin into alignment with spec!
//   if (
//     attributes['graphql.operation.type'] !== undefined ||
//     attributes['graphql.operation.name'] !== undefined ||
//     attributes['graphql.operation.document'] !== undefined ||
//     attributes['graphql.execute.operationName'] !== undefined ||
//     attributes['graphql.execute.document'] !== undefined ||
//     attributes['graphql.execute.result'] !== undefined ||
//     attributes['graphql.execute.error'] !== undefined ||
//     attributes['graphql.execute.variables'] !== undefined
//   ) {
//     return 'graphql'
//   }

//   // SQL Statements
//   if (attributes['db.statement'] !== undefined) {
//     return 'sql'
//   }

//   // Prisma Operations
//   if (span.name.startsWith('prisma:client:operation')) {
//     return 'prisma'
//   }

//   // Redwood Services
//   if (span.name.startsWith('redwoodjs:api:services')) {
//     return 'redwood-service'
//   }

//   return null
// }

// function extractFeatureFromSpan(span: any): any | null {
//   const attributes = JSON.parse(span.attributes)
//   const spanType = determineSpanType(span)
//   switch (spanType) {
//     case 'graphql':
//       return {
//         id: span.id,
//         type: spanType,
//         brief:
//           attributes['graphql.operation.name'] ||
//           attributes['graphql.execute.operationName'],
//       }
//     case 'redwood-service':
//       return {
//         id: span.id,
//         type: spanType,
//         brief: `${attributes['code.filepath'].substring(
//           attributes['code.filepath'].lastIndexOf(path.sep) + 1
//         )} - ${attributes['code.function']}`,
//       }
//     default:
//       return null
//   }
// }
