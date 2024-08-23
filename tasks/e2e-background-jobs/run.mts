import process from 'node:process'

import { $, cd, path, ProcessOutput, fs } from 'zx'

import {
  SAMPLE_FUNCTION,
  SAMPLE_JOB_PERFORM_ARGS,
  SAMPLE_JOB_PERFORM_BODY,
} from './fixtures.mjs'
import { projectDirectoryExists, projectFileExists } from './util.mjs'

$.env.DATABASE_URL = 'file:./dev.db'

async function main() {
  // We expect the first argument to be a path to a redwood project to run the test in
  const inputPath = process.argv[2]
  if (!inputPath) {
    console.error('No project path provided')
    process.exit(1)
  }

  // Change to the project directory
  const projectPath = path.resolve(inputPath)
  cd(projectPath)

  console.log(`Running background jobs E2E tests in project: ${projectPath}`)

  // Step 1: Run the jobs setup command
  console.log('Testing: `yarn rw setup jobs`')
  try {
    await $`yarn rw setup jobs`
  } catch (error) {
    if (error instanceof ProcessOutput) {
      console.error("Failed to run: 'yarn rw setup jobs'")
      console.error(error.toString())
      process.exit(1)
    } else {
      throw error
    }
  }

  // Confirm job config file
  if (
    !projectFileExists({
      projectPath,
      filePath: 'api/src/lib/jobs.ts',
    })
  ) {
    console.error("Expected file 'api/src/lib/jobs.ts' not found")
    process.exit(1)
  }
  console.log('Confirmed: job config file')

  // Confirm jobs directory
  if (
    !projectDirectoryExists({
      projectPath,
      directoryPath: 'api/src/jobs',
    })
  ) {
    console.error("Expected directory 'api/src/jobs' not found")
    process.exit(1)
  }
  console.log('Confirmed: jobs directory')

  // Confirm jobs dependency in api package.json
  const apiPackageJson = await import(
    path.join(projectPath, 'api/package.json')
  )
  if (!apiPackageJson.dependencies['@redwoodjs/jobs']) {
    console.error(
      "Expected dependency '@redwoodjs/jobs' not found in 'api/package.json'",
    )
    process.exit(1)
  }
  console.log('Confirmed: jobs dependency in api package.json')

  // Step 2: Migrate the database
  console.log('Testing: `yarn rw prisma migrate dev`')
  try {
    await $`yarn rw prisma migrate dev --name e2e-background-jobs`
  } catch (error) {
    if (error instanceof ProcessOutput) {
      console.error("Failed to run: 'yarn rw prisma migrate dev'")
      console.error(error.toString())
      process.exit(1)
    } else {
      throw error
    }
  }

  // Confirm the prisma model exists
  await $`yarn rw build api`
  const { db } = await import(path.join(projectPath, 'api/dist/lib/db.js'))
  const model = db['BackgroundJob']
  if (model?.name !== 'BackgroundJob') {
    console.error("Expected database model 'BackgroundJob' not found")
    process.exit(1)
  }
  console.log('Confirmed: prisma model exists')

  // Step 3: Generate a job
  console.log('Testing: `yarn rw generate job SampleJob`')
  try {
    await $`yarn rw generate job SampleJob`
  } catch (error) {
    if (error instanceof ProcessOutput) {
      console.error("Failed to run: 'yarn rw generate job SampleJob'")
      console.error(error.toString())
      process.exit(1)
    } else {
      throw error
    }
  }

  // Confirm the job file exists
  const expectedFiles = [
    'api/src/jobs/SampleJob/SampleJob.ts',
    'api/src/jobs/SampleJob/SampleJob.test.ts',
    'api/src/jobs/SampleJob/SampleJob.scenarios.ts',
  ]
  for (const file of expectedFiles) {
    if (!projectFileExists({ projectPath, filePath: file })) {
      console.error(`Expected file '${file}' not found`)
      process.exit(1)
    }
  }

  // Step 4: Alter the job to perform some test logic
  console.log('Action: Altering the job to perform some test logic')
  const jobPath = path.join(projectPath, 'api/src/jobs/SampleJob/SampleJob.ts')
  let jobContents = fs.readFileSync(jobPath, 'utf8')
  jobContents = jobContents.replace(`async ()`, SAMPLE_JOB_PERFORM_ARGS)
  jobContents = jobContents.replace(
    `jobs.logger.info('SampleJob is performing...')`,
    SAMPLE_JOB_PERFORM_BODY,
  )
  fs.writeFileSync(jobPath, jobContents)

  // Step 5: Add a function to trigger scheduling a job
  console.log('Action: Adding a function to trigger scheduling a job')
  const functionPath = path.join(projectPath, 'api/src/functions/run.ts')
  fs.writeFileSync(functionPath, SAMPLE_FUNCTION)

  // Step 6: Start the dev server
  console.log('Action: Running `yarn rw serve api`')
  await $`yarn rw build api`
  const apiServer = $`yarn rw serve api`.nothrow()

  // Wait for the dev server to start
  await new Promise((resolve) => {
    apiServer.stdout.on('data', (data) => {
      if (data.includes('API server listening at')) {
        resolve(null)
      }
    })
  })

  // Step 7: Trigger the function
  const testFileName = 'BACKGROUND_JOB_TEST.txt'
  const location = path.join(projectPath, testFileName)
  const data = Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(7, '0')

  console.log('Action: Triggering the function')
  await fetch(`http://localhost:8911/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      location,
      data,
    }),
  })

  // Step 8: Stop the dev server
  console.log('Action: Stopping the api server')
  await apiServer.kill('SIGINT')

  // Step 9: Confirm the job did not run synchronously
  console.log('Testing: Confirming the job did not run synchronously')
  if (
    projectFileExists({
      projectPath,
      filePath: testFileName,
    })
  ) {
    console.error('Expected file to not exist yet')
    process.exit(1)
  }
  console.log('Confirmed: job did not run synchronously')

  // Step 10: Confirm the job was scheduled into the database
  console.log('Testing: Confirming the job was scheduled into the database')
  const job = await db.backgroundJob.findFirst()
  if (!job) {
    console.error('Expected job not found in the database')
    process.exit(1)
  }
  const handler = JSON.parse(job.handler ?? {})
  const args = handler?.args ?? []
  if (args[0] !== location || args[1] !== data) {
    console.error('Expected job arguments do not match')
    process.exit(1)
  }
  console.log('Confirmed: job was scheduled into the database')

  // Step 11: Run the jobs worker
  console.log('Testing: `yarn rw jobs workoff`')
  try {
    await $`yarn rw jobs workoff`
  } catch (error) {
    if (error instanceof ProcessOutput) {
      console.error("Failed to run: 'yarn rw jobs workoff'")
      console.error(error.toString())
      process.exit(1)
    } else {
      throw error
    }
  }

  // Step 12: Confirm the job ran
  console.log('Testing: Confirming the job ran')
  if (
    !projectFileExists({
      projectPath,
      filePath: testFileName,
    })
  ) {
    console.error('Expected file not found')
    process.exit(1)
  }
  const fileContents = fs.readFileSync(location, 'utf8')
  if (fileContents !== data) {
    console.error('Expected file contents do not match')
    process.exit(1)
  }
  console.log('Confirmed: job ran')

  // Step 13: Confirm the job was removed from the database
  console.log('Testing: Confirming the job was removed from the database')
  const jobAfter = await db.backgroundJob.findFirst()
  if (jobAfter) {
    console.error('Expected job found in the database')
    process.exit(1)
  }
  console.log('Confirmed: job was removed from the database')

  console.log('All tests passed')
}

main()
