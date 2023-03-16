import { getDatabase } from '../database'

export const traces = async (_parent: unknown) => {
  const db = await getDatabase()
  const stmt = await db.prepare('SELECT * FROM span;')
  const spans = await stmt.all()
  await stmt.finalize()

  const traceIds = new Set(spans.map((span) => span.trace))

  const results: any = []
  for (const traceId of traceIds) {
    const traceSpans = spans
      .filter((span) => span.trace === traceId)
      .map((span) => restructureSpan(span))

    results.push({
      id: traceId,
      spans: traceSpans,
      enhancements: buildEnhancements(traceSpans),
    })
  }
  return results
}

export const trace = async (_parent: any, { id }: { id: string }) => {
  const db = await getDatabase()
  const stmt = await db.prepare('SELECT * FROM span WHERE trace=?;')
  const spans = await stmt.all(id)
  await stmt.finalize()

  const restructuredSpans = spans.map((span) => restructureSpan(span))
  return {
    id,
    spans: restructuredSpans,
    enhancements: buildEnhancements(restructuredSpans),
  }
}

export const traceCount = async (_parent: unknown) => {
  const db = await getDatabase()
  const stmt = await db.prepare(
    'SELECT COUNT(DISTINCT trace) AS trace_count FROM span;'
  )
  const result = await stmt.get()
  await stmt.finalize()

  return result['trace_count']
}

const buildEnhancements = (spans: any[]) => {
  const enhancements = {
    features: [] as string[],
    containsError: false,
  }
  spans.forEach((span) => {
    if (span.statusCode) {
      enhancements.containsError = true
    }
    if (span.name.startsWith('redwoodjs:api:services')) {
      enhancements.features.push('service_function')
    }
    const attributesKeys = Object.keys(JSON.parse(span.attributes))

    if (attributesKeys.includes('db.statement')) {
      enhancements.features.push('sql')
    }

    if (
      attributesKeys.includes('graphql.resolver.fieldName') ||
      attributesKeys.includes('graphql.resolver.typeName')
    ) {
      enhancements.features.push('graphql')
    }
  })
  enhancements.features = Array.from(new Set(enhancements.features))
  return enhancements
}

const restructureSpan = (span: any) => {
  const restructuredSpan = {
    id: span.id,
    trace: span.trace,
    parent: span.parent,
    name: span.name,
    kind: span.kind,
    statusCode: span.status_code,
    statusMessage: span.status_message,
    startNano: span.start_nano,
    endNano: span.end_nano,
    durationNano: span.duration_nano,
    events: span.events,
    attributes: span.attributes,
    resources: span.resources,
  }
  return restructuredSpan
}
