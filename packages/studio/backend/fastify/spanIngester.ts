import { FastifyInstance } from 'fastify'

import { getDatabase } from '../database'
import { retypeSpan } from '../services/span'
import type {
  RawAttribute,
  RestructuredAttributes,
  RawEvent,
  RestructuredEvent,
  RestructuredSpan,
  ResourceSpan,
} from '../types'

function restructureAttributes(rawAttributes: RawAttribute[]) {
  const restructuredAttributes: RestructuredAttributes = {}
  for (const rawAttribute of rawAttributes) {
    // Value is typically under a key such as "boolValue", "stringValue", etc. just take whatever one we find
    const keys = Object.keys(rawAttribute.value)
    const valueIdentifier = keys.length > 0 ? keys[0] : undefined
    if (valueIdentifier === undefined) {
      continue
    }
    switch (valueIdentifier) {
      case 'stringValue':
        restructuredAttributes[rawAttribute.key] = rawAttribute.value
          .stringValue as string
        break
      case 'intValue':
        restructuredAttributes[rawAttribute.key] = parseInt(
          rawAttribute.value.intValue as string
        )
        break
      case 'boolValue':
        restructuredAttributes[rawAttribute.key] = rawAttribute.value
          .boolValue as boolean
        break
      default:
        // If value is "{}" pass null instead, otherwise just pass whatever it happens to be
        restructuredAttributes[rawAttribute.key] = rawAttribute.value.value
          ? JSON.stringify(rawAttribute.value.value)
          : null
        break
    }
  }
  return restructuredAttributes
}

function restructureEvents(rawEvents: RawEvent[]) {
  const restructuredEvents: RestructuredEvent[] = []
  for (const rawEvent of rawEvents) {
    const restructuredEvent: RestructuredEvent = {
      name: rawEvent.name,
      time: rawEvent.timeUnixNano,
      attributes: restructureAttributes(rawEvent.attributes),
    }
    restructuredEvents.push(restructuredEvent)
  }
  return restructuredEvents
}

export default async function routes(fastify: FastifyInstance, _options: any) {
  fastify.post('/v1/traces', async (request, _reply) => {
    const data: { resourceSpans: ResourceSpan[] } = request.body as any

    const db = await getDatabase()
    const spanInsertStatement = await db.prepare(
      'INSERT INTO span (id, trace, parent, name, kind, status_code, status_message, start_nano, end_nano, duration_nano, events, attributes, resources) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, json(?), json(?), json(?)) RETURNING id;'
    )

    // TODO: Consider better typing here`
    const spans: RestructuredSpan[] = []

    // TODO: Consider less nesting if possible
    for (const resourceSpan of data.resourceSpans) {
      const resources = restructureAttributes(resourceSpan.resource.attributes)
      for (const scopeSpan of resourceSpan.scopeSpans) {
        for (const span of scopeSpan.spans) {
          const restructuredSpan: RestructuredSpan = {
            // Include the standard properties
            trace: span.traceId,
            id: span.spanId,
            parent: span.parentSpanId,
            name: span.name,
            kind: span.kind,
            statusCode: span.status?.code,
            statusMessage: span.status?.message,
            startNano: span.startTimeUnixNano,
            endNano: span.endTimeUnixNano,
            // Compute and store a duration for ease in analytics
            durationNano: Number(
              BigInt(span.endTimeUnixNano) - BigInt(span.startTimeUnixNano)
            ).toString(),
          }

          // TODO: Consider better handling of events
          if (span.events) {
            restructuredSpan.events = restructureEvents(span.events)
          }
          // Add attributes
          if (span.attributes) {
            restructuredSpan.attributes = restructureAttributes(span.attributes)
          }
          if (resources) {
            restructuredSpan.resourceAttributes = resources
          }
          spans.push(restructuredSpan)
        }
      }
    }

    for (const span of spans) {
      // Insert the span
      const spanInsertResult = await spanInsertStatement.get(
        span.id,
        span.trace,
        span.parent,
        span.name,
        span.kind,
        span.statusCode,
        span.statusMessage,
        span.startNano,
        span.endNano,
        span.durationNano,
        JSON.stringify(span.events),
        JSON.stringify(span.attributes),
        JSON.stringify(span.resourceAttributes)
      )
      if (spanInsertResult.id) {
        await retypeSpan(undefined, { id: spanInsertResult.id })
      }
      return spanInsertResult
    }

    return {}
  })
}
