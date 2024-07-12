# Background Jobs

No one likes waiting in line. This is especially true of your website: users don't want to wait for things to load that don't directly impact the task they're trying to accomplish. For example, sending a "welcome" email when a new user signs up. The process of sending the email could as long or longer than the sum total of everything else that happens during that request. Why make the user wait for it? As long as they eventually get the email, everything is good.

A typical create-user flow could look something like this:

![image](/img/background-jobs/jobs-before.png)

If we want the email to be send asynchonously, we can shuttle that process off into a **background job**:

![image](/img/background-jobs/jobs-after.png)

The user's response is returned much quicker, and the email is sent by another process which is connected to a user's session. All of the logic around sending the email is packaged up as a **job** and the **job server** is responsible for executing it.

The job is completely self-contained and has everything it needs to perform its task. Let's see how Redwood implements this workflow.

## Overview

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

Note the `PrismaAdapter` which is what enables storing jobs in the database. Calling `RedwoodJob.config()` sets the adapter and logger as the default for all other jobs in the system, but can be overridden on a per-job basis.

We'll go into more detail on this file later, but what's there now is fine to get started creating a job.

### Creating a Job

Jobs are defined as a subclass of the `RedwoodJob` class and at a minimum contains a function named `perform()` which contains the logic for your job. You can add as many additional functions you want to support the task your job is performing, but `perform()` is what's invoked by the **job runner** that we'll see later. The actual files for jobs live in `api/src/jobs`.

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

Note that `perform()` can take any arguments you want, but it's a best practice to keep them as simple as possible: a reference to this job and its arguments are stored in the database, so the list of arguments must be serializable to and from a string of JSON. Most jobs will probably act against data in your database, so it makes send to have the arguments simply be the `id` of those database records. When the job executes it will look up the full database record and then proceed from there.

As you can see, the code inside is identical to what you'd do if you were going to send an email directly from the `createUser` service. But now the user won't be waiting for `mailer.send()` to do its thing, it will happen behind the scenes.

There are a couple different ways to invoke a job, but the simplest is to include an instance of your new job in the `jobs` object that's exported at the end of `api/src/lib/jobs.js`:

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

If we were to query the `BackgroundJob` table now we'd see a new row:

```json
{
  id: 1,
  attempts: 0,
  handler: '{"handler":"SampleJob","args":[335]}',
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

:::info

Because we're using the `PrismaAdapter` here all jobs are stored in the database, but if you were using a different storage mechanism via a different adapter you would have to query those in a manner specific to that adapter's storage mechanism.

:::

That's it! Your application code can go about its business knowing that eventually that job will execute and the email will go out. Finally, let's look at how a job is run.

### Running a Job

In development you can start the job runner from the command line:

```bash
yarn rw jobs work
```

The runner is a sort of overseer that doesn't do any work itself, but spawns workers to actually execute the jobs. When starting in `work` mode a single worker will spin up and stay attached to the terminal and update you on the status of what it's doing:

![image](/img/background-jobs/jobs-terminal.png)

It checks the `BackgroundJob` table every few seconds for a new job and, if it finds one, locks it so that no other workers can have it, then calls `perform()` passing the arguments you gave to `performLater()`.

If the job succeeds then it's removed the database. If the job fails, the job is un-locked in the database, the `runAt` is set to an incremental backoff time in the future, and `lastError` is updated with the error that occurred. The job will now be picked up in the future once the `runAt` time has passed and it'll try again.

## Detailed Usage

### Global Job Configuration

### Per-job Configuration

### Job Scheduling

### Job Runner

#### Dev Modes

To run your jobs, start up the runner:

```bash
yarn rw jobs work
```

This process will stay attached the console and continually look for new jobs and execute them as they are found. To work on whatever outstanding jobs there are and then exit, use the `workoff` mode instead:

```bash
yarn rw jobs workoff
```

As soon as there are no more jobs to be executed (either the table is empty, or they are scheduled in the future) the process will automatically exit.

#### Clear

You can remove all jobs from storage with:

```bash
yarn rw jobs clear
```

#### Production Modes

To run the worker(s) in the background, use the `start` mode:

```bash
yarn rw jobs start
```

To stop them:

```bash
yarn rw jobs stop
```

You can start more than one worker by passing the `-n` flag:

```bash
yarn rw jobs start -n 4
```

If you want to specify that some workers only work on certain named queues:

```bash
yarn rw jobs start -n default:2,email:1
```

Make sure you pass the same flags to the `stop` process as the `start` so it knows which ones to stop. You can `restart` your workers as well.

In production you'll want to hook the workers up to a process monitor as, just like with any other process, they could die unexpectedly. More on this in the docs.

## Creating Your Own Adapter

## The Future

There's still more to add to background jobs! Our current TODO list:

* More adapters: Redis, SQS, RabbitMQ...
* RW Studio integration: monitor the state of your outstanding jobs
* Baremetal integration: if jobs are enabled, monitor the workers with pm2
* Recurring jobs
* Livecycle hooks: `beforePerform()`, `afterPerform()`, `afterSuccess()`, `afterFailure()`
