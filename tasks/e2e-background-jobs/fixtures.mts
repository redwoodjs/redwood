export const SAMPLE_JOB_PERFORM_ARGS = `async (location: string, data: string)`

export const SAMPLE_JOB_PERFORM_BODY = `
  const { default: fs } = await import('node:fs')
  fs.writeFileSync(location, data)
`

export const SAMPLE_FUNCTION = `
import type { APIGatewayEvent, Context } from 'aws-lambda'

import { SampleJob } from 'src/jobs/SampleJob/SampleJob'
import { later } from 'src/lib/jobs'

export const handler = async (event: APIGatewayEvent, _context: Context) => {
  const { location, data } = JSON.parse(event.body)

  await later(SampleJob, [location as string, data as string])

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      location,
      data,
    }),
  }
}
`

export const JOBS_SCRIPT = `
import { db } from 'api/src/lib/db'

export default async () => {
  const jobs = await db.backgroundJob.findMany()
  console.log(JSON.stringify(jobs))
}
`

export const PRISMA_SCRIPT = `
import { db } from 'api/src/lib/db'

export default async () => {
  const model = db.backgroundJob
  console.log(
    JSON.stringify({
      name: model.name,
    })
  )
}

`
