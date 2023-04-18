import { getDatabase } from '../database'

export const restructureSpan = (span: any) => {
  if (span == null) {
    return null
  }
  return {
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
    events: JSON.parse(span.events),
    attributes: JSON.parse(span.attributes),
    resources: JSON.parse(span.resources),
    type: span.type,
    brief: span.brief,
  }
}

export async function retypeSpan(_parent: unknown, { id }: { id: number }) {
  const db = await getDatabase()

  let lastID = undefined

  // HTTP Requests
  lastID = (
    await db.run(
      `
    UPDATE span SET
      type = 'http',
      brief = substr(json_extract(attributes, '$.\"http.method\"') || ' ' || json_extract(attributes, '$.\"http.method\"'), 0, 255)
    WHERE
      json_extract(attributes, '$.\"http.method\"') IS NOT NULL AND
      id = ?;
  `,
      id
    )
  ).lastID

  // GraphQL Requests
  lastID = (
    await db.run(
      `
    UPDATE span SET
      type = 'graphql',
      brief = NULL
    WHERE
      (
        json_extract(attributes, '$.\"graphql.operation.type\"') IS NOT NULL OR
        json_extract(attributes, '$.\"graphql.operation.name\"') IS NOT NULL OR
        json_extract(attributes, '$.\"graphql.operation.document\"') IS NOT NULL OR
        json_extract(attributes, '$.\"graphql.execute.operationName\"') IS NOT NULL OR
        json_extract(attributes, '$.\"graphql.execute.document\"') IS NOT NULL OR
        json_extract(attributes, '$.\"graphql.execute.result\"') IS NOT NULL OR
        json_extract(attributes, '$.\"graphql.execute.error\"') IS NOT NULL OR
        json_extract(attributes, '$.\"graphql.execute.variables\"') IS NOT NULL
      ) AND
      id = ?;
      `,
      id
    )
  ).lastID

  // SQL Statements
  lastID = (
    await db.run(
      `
    UPDATE span SET
      type = 'sql',
      brief = substr(json_extract(attributes, '$.\"db.statement\"'), 0, 255)
    WHERE
      json_extract(attributes, '$.\"db.statement\"') IS NOT NULL AND
      id = ?;
  `,
      id
    )
  ).lastID

  // Prisma Operations
  lastID = (
    await db.run(
      `
    UPDATE span SET
      type = 'prisma',
      brief = substr(json_extract(attributes, '$.\"name\"'), 0, 255)
    WHERE
      name LIKE 'prisma:client:operation%' AND
      id = ?;
  `,
      id
    )
  ).lastID

  // // Redwood Services
  lastID = (
    await db.run(
      `
    UPDATE span SET
      type = 'prisma',
      brief = NULL
    WHERE
      name LIKE 'redwoodjs:api:services%' AND
      id = ?;
  `,
      id
    )
  ).lastID

  return lastID === undefined
}

export async function retypeSpans(_parent: unknown) {
  const db = await getDatabase()

  // HTTP Requests
  await db.run(`
    UPDATE span SET
      type = 'http',
      brief = substr(json_extract(attributes, '$.\"http.method\"') || ' ' || json_extract(attributes, '$.\"http.method\"'), 0, 255)
    WHERE
      json_extract(attributes, '$.\"http.method\"') IS NOT NULL;
  `)

  // GraphQL Requests
  await db.run(`
    UPDATE span SET
      type = 'graphql',
      brief = NULL
    WHERE (
      json_extract(attributes, '$.\"graphql.operation.type\"') IS NOT NULL OR
      json_extract(attributes, '$.\"graphql.operation.name\"') IS NOT NULL OR
      json_extract(attributes, '$.\"graphql.operation.document\"') IS NOT NULL OR
      json_extract(attributes, '$.\"graphql.execute.operationName\"') IS NOT NULL OR
      json_extract(attributes, '$.\"graphql.execute.document\"') IS NOT NULL OR
      json_extract(attributes, '$.\"graphql.execute.result\"') IS NOT NULL OR
      json_extract(attributes, '$.\"graphql.execute.error\"') IS NOT NULL OR
      json_extract(attributes, '$.\"graphql.execute.variables\"') IS NOT NULL
    );
  `)

  // SQL Statements
  await db.run(`
    UPDATE span SET
      type = 'sql',
      brief = substr(json_extract(attributes, '$.\"db.statement\"'), 0, 255)
    WHERE
      json_extract(attributes, '$.\"db.statement\"') IS NOT NULL;
  `)

  // Prisma Operations
  await db.run(`
    UPDATE span SET
      type = 'prisma',
      brief = substr(json_extract(attributes, '$.\"name\"'), 0, 255)
    WHERE
      name LIKE 'prisma:client:operation%';
  `)

  // // Redwood Services
  await db.run(`
    UPDATE span SET
      type = 'prisma',
      brief = NULL
    WHERE
      name LIKE 'redwoodjs:api:services%';
  `)

  return true
}
