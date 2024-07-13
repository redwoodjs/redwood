# Background Jobs

No one likes waiting in line. This is especially true of your website: users don't want to wait for things to load that don't directly impact the task they're trying to accomplish. For example, sending a "welcome" email when a new user signs up. The process of sending the email could as long or longer than the sum total of everything else that happens during that request. Why make the user wait for it? As long as they eventually get the email, everything is good.

A typical create-user flow could look something like this:

![image](/img/background-jobs/jobs-before.png)

If we want the email to be send asynchonously, we can shuttle that process off into a **background job**:

![image](/img/background-jobs/jobs-after.png)

The user's response is returned much quicker, and the email is sent by another process which is connected to a user's session. All of the logic around sending the email is packaged up as a **job** and the **job server** is responsible for executing it.

The job is completely self-contained and has everything it needs to perform its task. Let's see how Redwood implements this workflow.

## Overview & Quick Start

### Workflow

There are three components to the background job system in Redwood:

1. Scheduling
2. Storage
3. Execution

**Scheduling** is the main interface to background jobs from within your application code. This is where you tell the system to run a job at some point in the future, whether that's "as soon as possible" or to delay for an amount of time first, or to run at a specific datetime in the future. Scheduling is handled by calling `performLater()` on an instance of your job.

**Storage** is necessary so that your jobs are decoupled from your application. By default jobs are stored in your database. This allows you to scale everything independently: the api server (which is scheduling jobs), the database (which is storing the jobs ready to be run), and the jobs runner (which is executing the jobs).

**Execution** is handled by the job runner, which takes a job from storage, executes it, and then does something with the result, whether it was a success or failure.

### Installation

To get started with jobs, run the setup command:

```bash
yarn rw setup jobs
```

This will add a new model to your Prisma schema, migrate the database, and create a configuration file at `api/src/lib/jobs.js` (or `.ts` for a Typescript project). Comments have been removed for brevity:

```js
import { PrismaAdapter, RedwoodJob } from '@redwoodjs/jobs'
import { db } from 'src/lib/db'
import { logger } from 'src/lib/logger'

export const adapter = new PrismaAdapter({ db, logger })

RedwoodJob.config({ adapter, logger })

export const jobs = {}
```

We'll go into more detail on this file later (see [RedwoodJob (Global) Configuration](#redwoodjob-global-configuration)), but what's there now is fine to get started creating a job.

### Creating a Job

We have a generator that creates a job in `api/src/jobs`:

```bash
yarn rw g job SendWelcomeEmail
```

Jobs are defined as a subclass of the `RedwoodJob` class and at a minimum must contain the function named `perform()` which contains the logic for your job. You can add as many additional functions you want to support the task your job is performing, but `perform()` is what's invoked by the **job runner** that we'll see later.

An example `SendWelcomeEmailJob` may look something like:

```js
import { RedwoodJob } from '@redwoodjs/jobs'
import { mailer } from 'src/lib/mailer'
import { WelcomeEmail } from 'src/mail/WelcomeEmail'

export class SendWelcomeEmailJob extends RedwoodJob {

  perform(userId) {
    const user = await db.user.findUnique({ where: { id: userId } })
    await mailer.send(WelcomeEmail({ user }), {
      to: user.email,
      subject: `Welcome to the site!`,
    })
  }

}
```

Note that `perform()` can take any arguments you want, but it's a best practice to keep them as simple as possible: a reference to this job and its arguments are stored in the database, so the list of arguments must be serializable to and from a string of JSON. Most jobs will probably act against data in your database, so it makes sense to have the arguments simply be the `id` of those database records. When the job executes it will look up the full database record and then proceed from there.

There are a couple different ways to invoke a job, but the simplest is to include an instance of your new job in the `jobs` object that's exported at the end of `api/src/lib/jobs.js` (note that the job generator will do this for you):

```js
import { PrismaAdapter, RedwoodJob } from '@redwoodjs/jobs'
import { db } from 'src/lib/db'
import { logger } from 'src/lib/logger'
// highlight-next-line
import { SendWelcomeEmailJob } from 'src/jobs/SendWelcomeEmailJob'

export const adapter = new PrismaAdapter({ db, logger })

RedwoodJob.config({ adapter, logger })

export jobs = {
  // highlight-next-line
  sendWelcomeEmailJob: new SendWelcomeEmailJob()
}
```

This makes it easy to import and schedule your job as we'll see next.

### Scheduling a Job

All jobs expose a `performLater()` function (inherited from the parent `RedwoodJob` class). Simply call this function when you want to schedule your job. Carrying on with our example from above, let's schedule this job as part of the `createUser()` service that used to be sending the email directly:

```js
// highlight-next-line
import { jobs } from 'api/src/lib/jobs'

export const createUser({ input }) {
  const user = await db.user.create({ data: input })
  // highlight-next-line
  await jobs.sendWelcomeEmailJob.performLater(user.id)
  return user
}
```

Or if you wanted to wait 5 minutes before sending the email you can set a `wait` time (number of seconds):

```js
await jobs.sendWelcomeEmailJob.set({ wait: 300 }).performLater(user.id)
```

If we were to query the `BackgroundJob` table after the job has been scheduled you'd see a new row:

```json
{
  id: 1,
  attempts: 0,
  handler: '{"handler":"SendWelcomeEmailJob","args":[335]}',
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

The `handler` field contains the name of the job class and the arguments its `perform()` function will receive.

:::info

Because we're using the `PrismaAdapter` here all jobs are stored in the database, but if you were using a different storage mechanism via a different adapter you would have to query those in a manner specific to that adapter's backend.

:::

### Executing Jobs

In development you can start the job runner from the command line:

```bash
yarn rw jobs work
```

The runner is a sort of overseer that doesn't do any work itself, but spawns workers to actually execute the jobs. When starting in `work` mode a single worker will spin up and stay attached to the terminal and update you on the status of what it's doing:

![image](/img/background-jobs/jobs-terminal.png)

It checks the `BackgroundJob` table every few seconds for a new job and, if it finds one, locks it so that no other workers can have it, then calls `perform()` passing the arguments you gave to `performLater()`.

If the job succeeds then it's removed the database. If the job fails, the job is un-locked in the database, the `runAt` is set to an incremental backoff time in the future, and `lastError` is updated with the error that occurred. The job will now be picked up in the future once the `runAt` time has passed and it'll try again.

## Detailed Usage

All jobs have some default configuration set for you if don't do anything different:

* `queue` jobs can be in named queues and have dedicated workers that only pull jobs from that queue. This lets you scale not only your entire job runner independently of the rest of your app, but scale the individual queues as well. By default, all jobs will go in a queue named "default" if you don't override it (see Per-job Configuration below).
* `priority` within a single queue you can jobs that are more or less important. The workers will pull jobs off the queue with a higher priority before working on ones with a lower priority. The default priority is `50`. A lower number is *higher* in priority than a lower number. ie. the workers will work on a job with a priority of `1` before they work on one with a priority of `100`.
* `logger` jobs will log to the console if you don't tell them otherwise. The logger exported from `api/src/lib/logger.js` works well the job runner, so we recommend using that by setting it in `RedwoodJob.config()` or on a per-job basis.
* `adapter`: the adapter to use to store this jobs. There is no default adapter set for jobs, so you'll need to set this in `RedwoodJob.config()` or on a per-job basis.

## RedwoodJob (Global) Configuration

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

This is the adapter that the job runner itself will use to run your jobs if you don't override the adapter in the job itself. In most cases this will be the same for all jobs, but just be aware that you can user different adapters for different jobs if you really want! Exporting an `adapter` in this file is required for the job runner to start.

### Configuring All Jobs with `RedwoodJob.config`

```js
RedwoodJob.config({ adapter, logger })
```

This is the global config for all jobs. You can override these values in individual jobs, but if you don't want to this saves you a lot of extra code configuring individual jobs over and over again with the same adapter, logger, etc.

Jobs will inherit a default queue name of `"default"` and a priority of `50`.

Config can be given the following options:

* `adapter`: **[required]** The adapter to use for scheduling your job.
* `logger`: Made available as `this.logger` within your job for logging whatever you'd like during the `perform()` step. This defaults to `console`.

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

It *is* possible to skip this export altogther and import and schedule individual jobs manually:

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

* Invoke `RedwoodJob.config()` somewhere before scheduling your job
* Manually set the adapter/logger/etc. in each of your jobs.

We'll see examples of configuring the individual jobs with an adapter and logger below.

:::

## Per-job Configuration

If you don't do anything special, a job will inherit the adapter and logger you set with the call to `RedwoodJob.config()`. However, you can override these settings on a per-job basis:

```js
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

The variables you can set this way are:

* `queue`: the named queue that jobs will be put in, defaults to `"default"`
* `priority`: an integer denoting the priority of this job (lower numbers are higher priority). Defaults to `50`
* `logger`: this will be made available as `this.logger` from within your job for internal logging. Defaults to `console`
* `adapter`: this is the adapter that's used when it comes time to schedule and store the job. There is no default, so this must be set either here or everywhere with `RedwoodJob.config({ adapter })` Redwood currently only ships with the `PrismaAdapter`

## Adapter Configuration

Adapters accept an object of options when they are initialized.

### PrismaAdapter

```js
import { db } from 'api/src/lib/db'

const adapter = new PrismaAdapter({ 
  db, 
  model: 'BackgroundJob', 
  logger: console, 
  maxAttemps: 24 
})
```

* `db`: **[required]** an instance of `PrismaClient` that the adapter will use to store, find and update the status of jobs. In most cases this will be the `db` variable exported from `api/src/lib/db.js`. This must be set in order for the adapter to be initialized!
* `model`: the name of the model that was created to store jobs. This defaults to `BackgroundJob`
* `logger`: events that occur within the adapter will be logged using this. This defaults to `console` but the `logger` exported from `api/src/lib/logger` works great, too.
* `maxAttempts` the number of times to allow a job to be retried before giving up. This defaults to `24`. If the `maxAttemps` is reached then the `failedAt` column is set in job's row in the database an no further attempts will be made to run it.

## Job Scheduling

The interface to schedule a job is very flexible. We have a recommended way, but there may be another that better suits your specific usecase.

### Instance Invocation

Using this pattern you instantiate the job first, set any options, then schedule it:

```js
import { SendWelcomeEmailJob } from 'api/src/jobs/SendWelcomeEmailJob`

const job = new SendWelcomeEmailJob()
job.set({ wait: 300 }).performLater()
```

You can also do the setting separate from the scheduling:

```js
const job = new SendWelcomeEmailJob()
job.set({ wait: 300 })
job.performLater()
```

Using this syntax you can also set the queue and priority for only *this instance* of the job, overriding the configuration set on the job itself:

```js
// Job uses the `default` queue and has a priority of `50`
const job = new SendWelcomeEmailJob()

job.set({ queue: 'email', priority: 1 })
// or
job.queue = 'email'
job.priority = 1

job.performLater()
```

You're using the instance invocation pattern when you add an instance of a job to the `jobs` export of `api/src/lib/jobs.js`:

```js
// api/src/lib/jobs.js
export const jobs = { 
  sendWelcomeEmail: new SendWelcomeEmailJob()
}

// api/src/services/users/users.js
export const createUser = async ({ input }) => {
  const user = await db.user.create({ data: input })
  await jobs.sendWelcomeEmail.set({ wait: 300 }).performLater()
  return user
}
```

### Class Invocation

You can schedule a job directly, without instantiating it first:

```js
import { AnnualReportGenerationJob } from 'api/src/jobs/AnnualReportGenerationJob'

AnnualReportGenerationJob.performLater()
// or
AnnualReportGenerationJob
  .set({ waitUntil: new Date(2025, 0, 1) })
  .performLater()
```

Using this syntax comes with a caveat: since no `RedwoodJob.config()` was called you would need to configure the adapter directly on `AnnualReportGenerationJob` (unless you were sure that `RedwoodJob.config()` was called somewhere before this code executes). See the note at the end of the [Exporting jobs](#exporting-jobs) section

### Scheduling Options

You can pass several options in a `set()` call on your instance or class:

* `wait`: number of seconds to wait before the job will run
* `waitUntil`: a specific `Date` in the future to run at
* `queue`: the named queue to put this job in (overrides any `static queue` set on the job itself)
* `priority`: the priority to give this job (overrides any `static priority` set on the job itself)
  
## Job Runner

The job runner actually executes your jobs. The runners will ask the adapter to find a job to work on. The adapter will mark the job as locked (the process name and a timestamp is set on the job) and then the worker will instantiate the job class and call `perform()` on it, passing in any args that were given to `performLater()`

The runner has several modes it can start in depending on how you want it to behave.

### Dev Modes

These modes are ideal when you're creating a job and want to be sure it runs correctly while developing. You could also use this in production if you wanted (maybe a job is failing and you want to watch verbose logs and see what's happening).

```bash
yarn rw jobs work
```

This process will stay attached the console and continually look for new jobs and execute them as they are found. Pressing Ctrl-C to cancel the process (sending SIGINT) will start a graceful shutdown: the workers will complete any work they're in the middle of before exiting. To cancel immediately, hit Ctrl-C again (or send SIGTERM) and they'll stop in the middle of what they're doing. Note that this could leave locked jobs in the database, but they will be picked back up again if a new worker starts with the same name as the one that locked the process.

To work on whatever outstanding jobs there are and then exit, use the `workoff` mode instead:

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

And to restart:

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

2 workers watching the `default` queue and 4 watching `email`.

If you want to combine named queues and all queues, leave off the name:

```bash
yarn rw jobs start -n :2,email:4
```

2 workers watching all queues and another 4 dedicated to only `email`.

### Stopping Multiple Workers

Make sure you pass the same flags to the `stop` process as the `start` so it knows which ones to stop. The same with the `restart` command.

### Monitoring the Workers

In production you'll want to hook the workers up to a process monitor since, just like with any other process, they could die unexpectedly.

### Clear

You can remove all jobs from storage with:

```bash
yarn rw jobs clear
```

## Creating Your Own Adapter

TODO

* `find()` should find a job to be run, lock it and return it (minimum return of `handler` and `args`)
* `schedule()` accepts `handler`, `args`, `runAt`, `queue` and `priority` and should store the job
* `success()` accepts the job returned from `find()` and does whatever success means (delete)
* `failure()` accepts the job returned from `find()` and does whatever failure means (unlock and reschedule)
* `clear()` removes all jobs

## The Future

There's still more to add to background jobs! Our current TODO list:

* More adapters: Redis, SQS, RabbitMQ...
* RW Studio integration: monitor the state of your outstanding jobs
* Baremetal integration: if jobs are enabled, monitor the workers with pm2
* Recurring jobs
* Livecycle hooks: `beforePerform()`, `afterPerform()`, `afterSuccess()`, `afterFailure()`
