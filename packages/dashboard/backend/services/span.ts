import { getDatabase } from '../database'

export const traces = async (_parent: unknown) => {
  const db = await getDatabase()
  const stmt = await db.prepare('SELECT * FROM span;')
  const spans = await stmt.all()

  const traceIds = new Set(spans.map((span) => span.trace))

  const results: any = []
  for (const traceId of traceIds) {
    results.push({
      id: traceId,
      spans: spans
        .filter((span) => span.trace === traceId)
        .map((span) => restructureSpan(span)),
    })
  }
  return results
}

export const trace = async (_parent: any, { id }: { id: string }) => {
  const db = await getDatabase()
  const stmt = await db.prepare('SELECT * FROM span WHERE trace=?;')
  const spans = await stmt.all(id)
  return {
    id,
    spans: spans.map((span) => restructureSpan(span)),
  }
}

const restructureSpan = (span: any) => {
  const restructuredSpan = {
    id: span.id,
    trace: span.span,
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
