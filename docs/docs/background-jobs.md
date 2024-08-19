# Background Jobs

No one likes waiting in line. This is especially true of your website: users don't want to wait for things to load that don't directly impact the task they're trying to accomplish. For example, sending a "welcome" email when a new user signs up. The process of sending the email could as long or longer than the sum total of everything else that happens during that request. Why make the user wait for it? As long as they eventually get the email, everything is good.

## Concepts

A typical create-user flow could look something like this:

![image](/img/background-jobs/jobs-before.png)

If we want the email to be send asynchonously, we can shuttle that process off into a **background job**:

![image](/img/background-jobs/jobs-after.png)

The user's response is returned much quicker, and the email is sent by another process, literally running in the background. All of the logic around sending the email is packaged up as a **job** and a **job worker** is responsible for executing it.

The job is completely self-contained and has everything it needs to perform its task. There are three components to the background job system in Redwood:

1. Scheduling
2. Storage
3. Execution

**Scheduling** is the main interface to background jobs from within your application code. This is where you tell the system to run a job at some point in the future, whether that's:

- as soon as possible
- delay for an amount of time before running
- run at a specific datetime in the future

**Storage** is necessary so that your jobs are decoupled from your running application. With the included `PrismaAdapter` jobs are stored in your database. This allows you to scale everything independently: the api server (which is scheduling jobs), the database (which is storing the jobs ready to be run), and the job workers (which are executing the jobs).

**Execution** is handled by a job worker, which takes a job from storage, executes it, and then does something with the result, whether it was a success or failure.

:::info Job execution time is never guaranteed

When scheduling a job, you're really saying "this is the earliest possible time I want this job to run": based on what other jobs are in the queue, and how busy the workers are, they may not get a chance to execute this one particiular job for an indeterminate amount of time. The only thing that's guaranteed is that it won't run any _earlier_ than the time you specify.

:::

## Quick Start

We'll get into more detail later, but if you just to get up and running quickly, here we go.

### Setup

Run the setup command to get the jobs configuration file created and migrate the database with a new `BackgroundJob` table:

```bash
yarn rw setup jobs
yarn rw prisma migrate dev
```

This created `api/src/lib/jobs.js` (or `.ts`) with a sample config. You can leave this as is for now.

### Create a Job

```bash
yarn rw g job SampleJob
```

This created `api/src/jobs/SampleJob/SampleJob.js` and a test and scenario file. For now the job just outputs a message to the logs, but you'll fill out the `perform()` function to take any arguments you want and perform any work you want to do. Let's update the job to take a user's `id` and then just print that to the logs:

```js
import { jobs } from 'src/lib/jobs'

export const SampleJob = jobs.createJob({
  queue: 'default',
  // highlight-start
  perform: async (userId) => {
    jobs.logger.info(`Received user id ${userId}`)
    // highlight-end
  },
})
```

### Schedule a Job

You'll most likely be scheduling work as the result of one of your service functions being executed. Let's say we want to schedule our `SampleJob` whenever a new user is created:

```js title="api/src/services/users/users.js"
import { db } from 'src/lib/db'
// highlight-next-line
import { later } from 'src/lib/jobs'
import { SampleJob } from 'src/jobs/SampleJob'

export const createUser = ({ input }) => {
  const user = await db.user.create({ data: input })
  // highlight-next-line
  await later(SampleJob, [user.id], { wait: 60 })
  return user
}
```

The second argument is an array of all the arguments your job should receive. The job itself defines them as normal, named arguments (like `userId`), but when you schedule you wrap them in an array (like `[user.id]`).

The third argument is an optional object that defines a couple of options. In this case, the number of seconds to `wait` before this job will be run (60 seconds).

If you check your database you'll see your job is now listed in the `BackgroundJob` table:

![image](/img/background-jobs/jobs-db.png)

### Executing a Job

Start the worker process to find jobs in the DB and execute them:

```bash
yarn rw jobs work
```

This process will stay attached to the terminal and show you debug log output as it looks for jobs to run. Note that since we scheduled our job to wait 60 seconds before running, the runner will not find a job to work on right away (unless it's already been a minute since you scheduled it!).

That's the basics of jobs! Keep reading to get the details, including how you to run your job runners in production.

## In-Depth Start

Let's go into more depth in each of the parts of the job system.

### Installation

To get started with jobs, run the setup command:

```bash
yarn rw setup jobs
```

This will add a new model to your Prisma schema, and create a configuration file at `api/src/lib/jobs.js` (or `.ts` for a Typescript project). You'll need to run migrations in order to actually create the model in your database:

```bash
yarn rw prisma migrate dev
```

Let's look at the config file. Comments have been removed for brevity:

```js
import { PrismaAdapter, JobManager } from '@redwoodjs/jobs'

import { db } from 'src/lib/db'
import { logger } from 'src/lib/logger'

export const jobs = new JobManager({
  adapters: {
    prisma: new PrismaAdapter({ db, logger }),
  },
  queues: ['default'] as const,
  logger,
  workers: [
    {
      adapter: 'prisma',
      logger,
      queue: '*',
      count: 1,
      maxAttempts: 24,
      maxRuntime: 14_400,
      deleteFailedJobs: false,
      sleepDelay: 5,
    },
  ],
})

export const later = jobs.createScheduler({
  adapter: 'prisma',
})
```

Two variables are exported: one is an instance of the `JobManager` called `jobs` on which you'll call functions to create jobs. The other is `later` which is an instance of the `Scheduler`, which is responsible for getting your job into the storage system (out of the box this will be the database thanks to the `PrismaAdapter`).

We'll go into more detail on this file later (see [Job Configuration](#job-configuration)), but what's there now is fine to get started creating a job.

### Creating New Jobs

We have a generator that creates a job in `api/src/jobs`:

```bash
yarn rw g job SendWelcomeEmail
```

Jobs are defined as a plain object and given to the `createJob()` function (which is called on the `jobs` export in the config file above).

At a minimum, a job must contain the name of the `queue` the job should be saved to, and a function named `perform()` which contains the logic for your job. You can add additional properties to the object to support the task your job is performing, but `perform()` is what's invoked by the job worker that we'll see later.

An example `SendWelcomeEmailJob` may look something like:

```js
import { db } from 'src/lib/db'
import { jobs } from 'src/lib/jobs'

export const SendWelcomeEmailJob = jobs.createJob({
  queue: 'default',
  perform: async (userId) => {
    const user = await db.user.findUnique({ where: { id: userId } })
    mailer.send(WelcomeEmail({ user }), {
      to: user.email,
      subject: `Welcome to the site!`,
    })
  },
})
```

Note that `perform()` can take any arguments you want, but it's a best practice to keep them as simple as possible. With the `PrismaAdapter` the arguments are stored in the database, so the list of arguments must be serializable to and from a string of JSON.

:::info Keeping Arguments Simple

Most jobs will probably act against data in your database, so it makes sense to have the arguments simply be the `id` of those database records. When the job executes it will look up the full database record and then proceed from there.

If it's likely that the data in the database will change before your job is actually run, but you need the job to run with the original data, you may want to include the original values as arguments to your job. This way the job is sure to be working with those original values and not the potentially changed ones in the database.

:::

### Scheduling Jobs

Remember the `later` export in the jobs config file:

```js
export const later = jobs.createScheduler({
  adapter: 'prisma',
})
```

You call this function, passing the job, job arguments, and an optional options object when you want to schedule a job. Let's see how we'd schedule our welcome email to go out when a new user is created:

```js
// highlight-next-line
import { SendWelcomeEmailJob } from 'src/jobs/SendWelcomeEmailJob'

export const createUser = async ({ input }) {
  const user = await db.user.create({ data: input })
  // highlight-next-line
  await later(SendWelcomeEmailJob, [user.id])
  return user
}
```

By default the job will run as soon as possible. If you wanted to wait five minutes before sending the email you can set a `wait` time to a number of seconds:

```js
later(SendWelcomeEmailJob, [user.id], { wait: 300 })
```

Or run it at a specific datetime:

```js
later(MilleniumAnnouncementJob, [user.id], {
  waitUntil: new Date(3000, 0, 1, 0, 0, 0),
})
```

:::info Running a Job Immediately

As noted in the [Concepts](#concepts) section, a job is never _guaranteed_ to run at an exact time. The worker could be busy working on other jobs and can't get to yours just yet.

If you absolutely, positively need your job to run right _now_ you can call your job's `perform` function directly in your code:

```js
await SampleEmailJob.perform(user.id)
```

:::

If we were to query the `BackgroundJob` table after the job has been scheduled you'd see a new row:

```js
{
  id: 132,
  attempts: 0,
  handler: '{"name":"SendWelcomeEmailJob",path:"SendWelcomeEmailJob/SendWelcomeEmailJob","args":[335]}',
  queue: 'default',
  priority: 50,
  runAt: 2024-07-12T22:27:51.085Z,
  lockedAt: null,
  lockedBy: null,
  lastError: null,
  failedAt: null,
  createdAt: 2024-07-12T22:27:51.125Z,
  updatedAt: 2024-07-12T22:27:51.125Z
}
```

The `handler` field contains the name of the job, file path to find it, and the arguments its `perform()` function will receive.

:::info

Because we're using the `PrismaAdapter` here all jobs are stored in the database, but if you were using a different storage mechanism via a different adapter you would have to query those in a manner specific to that adapter's backend.

:::

### Executing Jobs

In development you can start a job worker via the **job runner** from the command line:

```bash
yarn rw jobs work
```

The runner is a sort of overseer that doesn't do any work itself, but spawns workers to actually execute the jobs. When starting in `work` mode a single worker will spin up and stay attached to the terminal and update you on the status of what it's doing:

![image](/img/background-jobs/jobs-terminal.png)

It checks the `BackgroundJob` table every few seconds for a new job and, if it finds one, locks it so that no other workers can have it, then calls your `perform()` function, passing it the arguments you gave when you scheduled it.

If the job succeeds then by default it's removed the database (using the `PrismaAdapter`, other adapters behavior may vary). If the job fails, the job is un-locked in the database, the `runAt` is set to an incremental backoff time in the future, and `lastError` is updated with the error that occurred. The job will now be picked up in the future once the `runAt` time has passed and it'll try again.

There are a couple of additional modes that `rw jobs` can run in:

```bash
yarn rw jobs workoff
```

This mode will execute all jobs that eligible to run, then stop itself.

```bash
yarn rw jobs start
```

Starts the workers and then detaches them to run forever. Use `yarn rw jobs stop` to stop them, or `yarn rw jobs restart` to pick up any code changes to your jobs.

### Everything Else

The rest of this doc describes more advanced usage, like:

- Assigning jobs to named **queues**
- Setting a **priority** so that some jobs always run before others
- Using different adapters and loggers on a per-job basis
- Starting more than one worker
- Having some workers focus on only certain queues
- Configuring individual workers to use different adapters
- Manually workers without the job runner monitoring them
- And more!

## Job Configuration

Let's take a closer look at `api/src/lib/jobs.js`:

```js
import { PrismaAdapter, RedwoodJob } from '@redwoodjs/jobs'
import { db } from 'src/lib/db'
import { logger } from 'src/lib/logger'

export const adapter = new PrismaAdapter({ db, logger })

RedwoodJob.config({ adapter, logger })

export const jobs = {}
```

### Exporting an `adapter`

```js
export const adapter = new PrismaAdapter({ db, logger })
```

This is the adapter that the job runner itself will use to run your jobs if you don't override the adapter in the job itself. In most cases this will be the same for all jobs, but just be aware that you can use different adapters for different jobs if you really want! Exporting an `adapter` in this file is required for the job runner to start.

### Configuring All Jobs with `RedwoodJob.config`

```js
RedwoodJob.config({ adapter, logger })
```

This is the global config for all jobs. You can override these values in individual jobs, but if you don't want to this saves you a lot of extra code configuring individual jobs over and over again with the same adapter, logger, etc.

Jobs will inherit a default queue name of `"default"` and a priority of `50`.

Config can be given the following options:

- `adapter`: **[required]** The adapter to use for scheduling your job.
- `logger`: Made available as `this.logger` within your job for logging whatever you'd like during the `perform()` step. This defaults to `console`.

### Exporting `jobs`

```js
export const jobs = {}
```

We've found a nice convention is to export instances of all of your jobs here. Then you only have a single import to use in other places when you want to schedule a job:

```js
// api/src/lib/jobs.js
export const jobs = {
  sendWelcomeEmailJob: new SendWelcomeEmailJob(),
  // highlight-next-line
  productBackorderJob: new ProductBackorderJob(),
  inventoryReportGenJob: new InventoryReportGenJob(),
}

// api/src/services/products/products.js
import { jobs } from 'api/src/lib/jobs'

export const updateProduct = async ({ id, input }) => {
  const product = await db.product.update({ where: { id }, data: input })
  // highlight-next-line
  await jobs.productBackorderJob.performLater()
  return product
}
```

It _is_ possible to skip this export altogther and import and schedule individual jobs manually:

```js
// api/src/services/products/products.js
import { ProductBackorderJob } from 'api/src/jobs/ProductBackorderJob'

export const updateProduct = async ({ id, input }) => {
  const product = await db.product.update({ where: { id }, data: input })
  await ProductBackorderJob.performLater()
  return product
}
```

HOWEVER, this will lead to unexpected behavior if you're not aware of the following:

:::danger

If you don't export a `jobs` object and then `import` it when you want to schedule a job, the `Redwood.config()` line will never be executed and your jobs will not receive a default configuration! This means you'll need to either:

- Invoke `RedwoodJob.config()` somewhere before scheduling your job
- Manually set the adapter/logger/etc. in each of your jobs.

We'll see examples of configuring the individual jobs with an adapter and logger below.

:::

## Job Configuration

All jobs have some default configuration set for you if don't do anything different:

- `queue` : jobs can be in named queues and have dedicated workers that only pull jobs from that queue. This lets you scale not only your entire job runner independently of the rest of your app, but scale the individual queues as well. By default, all jobs will go in a queue named "default" if you don't override it.
- `priority` : within a single queue you can jobs that are more or less important. The workers will pull jobs off the queue with a higher priority before working on ones with a lower priority. The default priority is `50`. A lower number is _higher_ in priority than a lower number. ie. the workers will work on a job with a priority of `1` before they work on one with a priority of `100`.
- `logger` : jobs will log to the console if you don't tell them otherwise. The logger exported from `api/src/lib/logger.js` works well the job runner, so we recommend using that by setting it in `RedwoodJob.config()` or on a per-job basis.
- `adapter` : the adapter to use to store this jobs. There is no default adapter set for jobs, so you'll need to set this in `RedwoodJob.config()` or on a per-job basis.

If you don't do anything special, a job will inherit the adapter and logger you set with the call to `RedwoodJob.config()`. However, you can override these settings on a per-job basis. You don't have to set all of them, you can use them in any combination you want:

```js
import { RedwoodJob, PrismaAdapter } from '@redwoodjs/jobs'
import { db } from 'api/src/lib/db'
import { emailLogger } from 'api/src/lib/logger'

export const class SendWelcomeEmailJob extends RedwoodJob {
  // highlight-start
  static adapter = new PrismaAdapter({ db })
  static logger = emailLogger()
  static queue = 'email'
  static priority = '1'
  // highlight-end

  perform(userId) => {
    // ... send email ...
  }
}
```

## Adapter Configuration

Adapters accept an object of options when they are initialized.

### PrismaAdapter

```js
import { db } from 'api/src/lib/db'

const adapter = new PrismaAdapter({
  db,
  model: 'BackgroundJob',
  logger: console,
})
```

- `db`: **[required]** an instance of `PrismaClient` that the adapter will use to store, find and update the status of jobs. In most cases this will be the `db` variable exported from `api/src/lib/db.js`. This must be set in order for the adapter to be initialized!
- `model`: the name of the model that was created to store jobs. This defaults to `BackgroundJob`
- `logger`: events that occur within the adapter will be logged using this. This defaults to `console` but the `logger` exported from `api/src/lib/logger` works great, too.

## Job Scheduling

The interface to schedule a job is fairly flexible: use the pattern you like best! By default the generators will assume you want to use the [Instance Invocation](#instance-invocation) pattern, but maybe the [Class Invocation](#class-invocation) speaks to your soul!

### Instance Invocation

Using this pattern you instantiate the job first, set any options, then schedule it:

```js
import { SendWelcomeEmailJob } from 'api/src/jobs/SendWelcomeEmailJob`

const job = new SendWelcomeEmailJob()
job.set({ wait: 300 }).performLater()
```

You can also set options when you create the instance. For example, if _every_ invocation of this job should wait 5 minutes, no need to `set()` that each time, just initialize it with that option:

```js
// api/src/lib/jobs.js
export const jobs = {
  // highlight-next-line
  sendWelcomeEmail: new SendWelcomeEmailJob({ wait: 300 }),
}

// api/src/services/users/users.js
export const createUser = async ({ input }) => {
  const user = await db.user.create({ data: input })
  // highlight-next-line
  await jobs.sendWelcomeEmail.performLater()
  return user
}
```

`set()` will merge together with any options set when initialized, so you can, for example, override those settings on a one-off basis:

```js
// api/src/lib/jobs.js
export const jobs = {
  // highlight-next-line
  sendWelcomeEmail: new SendWelcomeEmailJob({ wait: 300 }), // 5 minutes
}

// api/src/services/users/users.js
export const createUser = async ({ input }) => {
  const user = await db.user.create({ data: input })
  // highlight-next-line
  await jobs.sendWelcomeEmail.set({ wait: 3600 }).performLater() // 1 hour
  return user
}
```

You can also do the setting separate from the scheduling:

```js
const job = new SendWelcomeEmailJob()
job.set({ wait: 300 })
// do something else...
job.performLater()
```

Once you have your instance you can inspect the options set on it:

```js
const job = new SendWelcomeEmail()
// set by RedwoodJob.config or static properies
job.adapter // => PrismaAdapter instance
jog.logger // => logger instance

// set via `set()` or provided during job instantiaion
job.queue // => 'default'
job.priority // => 50
job.wait // => 300
job.waitUntil // => null

// computed internally
job.runAt // => 2025-07-27 12:35:00 UTC
//    ^ the actual computed Date of now + `wait`
```

:::info

You can't set these values directly, that's done through `set()`. Also, you can never set `runAt`, that's computed internally. If you want your job to run at a specific time you can use the `waitUntil` option, See [Scheduling Options](#scheduling-options) below.

:::

### Class Invocation

You can schedule a job directly, without instantiating it first:

```js
import { AnnualReportGenerationJob } from 'api/src/jobs/AnnualReportGenerationJob'

AnnualReportGenerationJob.performLater()
// or
AnnualReportGenerationJob.set({
  waitUntil: new Date(2025, 0, 1),
}).performLater()
```

Using this syntax comes with a caveat: since no `RedwoodJob.config()` was called you would need to configure the `adapter` and `logger` directly on `AnnualReportGenerationJob` via static properties (unless you were sure that `RedwoodJob.config()` was called somewhere before this code executes). See the note at the end of the [Exporting jobs](#exporting-jobs) section explaining this limitation.

### Scheduling Options

You can pass several options in a `set()` call on your instance or class:

- `wait`: number of seconds to wait before the job will run
- `waitUntil`: a specific `Date` in the future to run at
- `queue`: the named queue to put this job in (overrides any `static queue` set on the job itself)
- `priority`: the priority to give this job (overrides any `static priority` set on the job itself)

## Job Runner

The job runner actually executes your jobs. The runners will ask the adapter to find a job to work on. The adapter will mark the job as locked (the process name and a timestamp is set on the job) and then the worker will instantiate the job class and call `perform()` on it, passing in any args that were given to `performLater()`

The runner has several modes it can start in depending on how you want it to behave.

### Dev Modes

These modes are ideal when you're creating a job and want to be sure it runs correctly while developing. You could also use this in production if you wanted (maybe a job is failing and you want to watch verbose logs and see what's happening).

```bash
yarn rw jobs work
```

This process will stay attached the console and continually look for new jobs and execute them as they are found. The log level is set to `debug` by default so you'll see everything. Pressing Ctrl-C to cancel the process (sending SIGINT) will start a graceful shutdown: the workers will complete any work they're in the middle of before exiting. To cancel immediately, hit Ctrl-C again (or send SIGTERM) and they'll stop in the middle of what they're doing. Note that this could leave locked jobs in the database, but they will be picked back up again if a new worker starts with the same name as the one that locked the process. They'll also be picked up automatically after `maxRuntime` has expired, even if they are still locked.

:::caution Long running jobs

It's currently up to you to make sure your job completes before your `maxRuntime` limit is reached! NodeJS Promises are not truly cancelable: you can reject early, but any Promises that were started _inside_ will continue running unless they are also early rejected, recursively forever.

The only way to guarantee a job will completely stop no matter what is for your job to spawn an actual OS level process with a timeout that kills it after a certain amount of time. We may add this functionality natively to Jobs in the near future: let us know if you'd benefit from this being built in!

:::

To work on whatever outstanding jobs there are and then automaticaly exit use the `workoff` mode:

```bash
yarn rw jobs workoff
```

As soon as there are no more jobs to be executed (either the store is empty, or they are scheduled in the future) the process will automatically exit.

By default this worker will work on all queues, but if you only wanted it to work on a specific one even in dev, check out the `-n` flag described in the [Multiple Workers](#multiple-workers) section below.

### Production Modes

In production you'll want your job workers running forever in the background. For that, use the `start` mode:

```bash
yarn rw jobs start
```

That will start a single worker, watching all queues, and then detatch it from the console. If you care about the output of that worker then you'll want to have configured a logger that writes to the filesystem or sends to a third party log aggregator.

To stop the worker:

```bash
yarn rw jobs stop
```

Or to restart on that's already running:

```bash
yarn rw jobs restart
```

### Multiple Workers

You can start more than one worker with the `-n` flag:

```bash
yarn rw jobs start -n 4
```

That starts 4 workers watching all queues. To only watch a certain queue, you can combine the queue name with the number that should start, separated by a `:`:

```bash
yarn rw jobs start -n email:2
```

That starts 2 workers that only watch the `email` queue. To have multiple workers watching separate named queues, separate those with commas:

```bash
yarn rw jobs start -n default:2,email:4
```

That starts 2 workers watching the `default` queue and 4 watching `email`.

If you want to combine named queues and all queues, leave off the name:

```bash
yarn rw jobs start -n :2,email:4
```

2 workers watching all queues and another 4 dedicated to only `email`.

### Stopping Multiple Workers

Make sure you pass the same `-n` flag to the `stop` process as the `start` so it knows which ones to stop. The same with the `restart` command.

### Monitoring the Workers

In production you'll want to hook the workers up to a process monitor since, just like with any other process, they could die unexpectedly.

### Clear

You can remove all jobs from storage with:

```bash
yarn rw jobs clear
```

## Deployment

For many use cases you may simply be able to rely on the job runner to start your job workers, which will run forever:

```bash
yarn rw jobs start
```

See the options available in [Job Runner > Production Modes](#production-modes) for additional flags.

When you deploy new code you'll want to restart your runners to make sure they get the latest soruce files:

```bash
yarn rw jobs restart
```

Using this utility, however, gives you nothing to monitor that your jobs workers are still running: the runner starts the required number of workers, detaches them, and then exits itself. Node processes are pretty robust, but by no means are they guaranteed to run forever with no problems. You could mistakenly release a bad job that has an infinite loop or even just a random gamma ray striking the RAM of the server could cause a panic and the process will be shut down.

For maximum reliability you should take a look at the [Advanced Job Workers](#advanced-job-workers) section and manually start your workers this way, with a process monitor like [pm2](https://pm2.keymetrics.io/) or [nodemon](https://github.com/remy/nodemon) to watch and restart the workers if something unexpected happens.

:::info

Of course if you have a process monitor system watching your workers you'll to use the process monitor's version of the restart command each time you deploy!

:::

## Advanced Job Workers

In the cases above, all workers will use the same `adapter`, `logger` and `workerConfig` exported from your jobs config file at `api/src/lib/jobs.js`. However, it's possible to have workers running completely different configurations. To do this, you'll need to start the worker directly, instead of having the build-in job runner start them for you.

To start the worker yourself you'll run the `yarn rw-jobs-worker` command. As an example, to start a worker with the same configruation options that `yarn rw jobs work` would use, you'd run the following command:

```bash
yarn rw-jobs-worker --id=0 --maxAttempts=24 --maxRuntime=14400 --sleepDelay 5 --adapter=adapter --logger=logger
```

The job runner sets the `--maxAttempts`, `--maxRuntime` and `--sleepDelay` flags based on the values in the `workerConfig` variable. The `--adapter` and `--logger` flags denote the name of the exported variables that the worker should load in order to set itself up to run jobs.

### Flags

- `--id` : a number identifier that's set as part of the process name. For example starting a worker with \* `--id=0` and then inspecting your process list will show one running named `rw-job-worker.0`
- `--queue` : the named queue for the worker to focus on. Leaving this flag off defaults to watching all queues. This will also effect the process title name. Setting `--queue=email` would lead to process named \* `rw-job-worker.email.0` (assuming `--id=0`)
- `--workoff` : if this flag is present then the worker will terminate itself after the queue it is watching is empty
- `--clear` : if this flag is present the worker will call the `clear()` function on the adapter (which should remove all jobs in storage) and then exit
- `--maxAttempts` : The max number of times to retry a job before considering it failed, and will not be retried. Defaults to `24`.
- `--maxRuntime` : The max amount of time, in seconds, a job should run before being eligible to be picked up by another worker instead, effectively starting over. Defaults to `14400` which is 4 hours.
- `--sleepDelay` : How long to wait, in seconds, before querying the adapter for another available job to run. Careful not to DDoS your job storage system by setting this too low!
- `--deleteFailedJobs` : If `maxAttempts` is reached, what to do with the job. Defaults to `false` meaning the job will remain in the queue, but the workers will not pick it up to work on again. Useful for debugging why a job may have failed.
- `--adapter` : The name of the variable exported from `api/src/lib/jobs.js` to use as the adapter for this worker instance. Defalts to `adapter`. The worker will error on startup if this variable is not exported by your jobs config file.
- `--logger` : The name of the variable exported from `api/src/lib/jobs.js` to us as the logger for this worker instance. Defaults to `logger` but will fall back to `console` if no `logger` is exported.

## Creating Your Own Adapter

We'd love the community to contribue adapters for Redwood Job! Take a look at the source for `BaseAdapter` for what's absolutely required, and then the source for `PrismaAdapter` to see a concrete implementation.

The general gist of the required functions:

- `find()` should find a job to be run, lock it and return it (minimum return of and object containing `handler` and `args` properties)
- `schedule()` accepts `handler`, `args`, `runAt`, `queue` and `priority` and should store the job
- `success()` accepts the same job object returned from `find()` and does whatever success means (delete the job from the queue, most likely)
- `failure()` accepts the same job object returned from `find()` and does whatever failure means (unlock the job and reschedule a time for it to run again in the future, or give up if `maxAttempts` is reached)
- `clear()` remove all jobs from the queue (mostly used in development)

## The Future

There's still more to add to background jobs! Our current TODO list:

- More adapters: Redis, SQS, RabbitMQ...
- RW Studio integration: monitor the state of your outstanding jobs
- Baremetal integration: if jobs are enabled, monitor the workers with pm2
- Recurring jobs
- Livecycle hooks: `beforePerform()`, `afterPerform()`, `afterSuccess()`, `afterFailure()`
