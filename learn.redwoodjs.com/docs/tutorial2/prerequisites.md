---
id: prerequisites
title: "Prerequisites"
sidebar_label: "Prerequisites"
---

You'll need to be on at least a release candidate of Redwood v1.0 to make it through this tutorial.

We highly recommend going through the first tutorial or at least have built a slightly complex Redwood app on your own. You've hopefully got experience with:

* Authentication
* Cells
* GraphQL & SDLs
* Services

If you've been through the first part of the tutorial, you can pick up where you left off and continue here with part 2. Or, you can start from an [example repo](https://github.com/redwoodjs/redwood-tutorial) that picks up at the end of part 1, but already has additional styling and a starting test suite.

### Using Your Own Repo

If you want to use the same CSS classes we use in the following examples you'll need to add Tailwind to your repo:

```bash
yarn rw setup ui tailwindcss
```

However, none of the screenshots below will come anywhere close to what you're seeing (except for those isolated components you build in Storybook) so you may want to just start with the [example repo](https://github.com/redwoodjs/redwood-tutorial). You'll also be missing out on a good starting test suite that we added to the example repo!

If you're *still* set on continuting with your own repo, and you deployed Part 1 to a service like Netlify, you would have changed database provider in `schema.prisma` to `postgres`. If that's the case then make sure your local development environment has changed over as well. Check out the [Local Postgres Setup](https://redwoodjs.com/docs/local-postgres-setup) for assistance. If you stick with the [example repo](https://github.com/redwoodjs/redwood-tutorial) instead, it uses good ol' SQLite.

Once you're ready, start up the dev server with your repor:

```bash
yarn rw dev
```

### Using the Example Repo

If you haven't been through the first tutorial, or maybe you went through it on an older version of Redwood (anything pre-0.41) you can clone [this repo](https://github.com/redwoodjs/redwood-tutorial) which contains everything built in part 1 and also adds a little styling so it isn't quite so...tough to look at. Don't get us wrong, what we built in Part I had a great personality! We just gave it some hipper clothes and a nice haircut. We used [TailwindCSS](https://tailwindcss.com) to style things up and added a `<div>` or two to give us some additional hooks to hang styling on.

```bash
git clone https://github.com/redwoodjs/redwood-tutorial
cd redwood-tutorial
yarn install
yarn rw prisma migrate dev
yarn rw dev
```

That'll check out the repo, install all the dependencies, create your local database (SQLite) and fill it with a few blog posts, and finally start up the dev server.

### Startup

Your browser should open to a fresh new blog app:

![image](https://user-images.githubusercontent.com/300/101423176-54e93780-38ad-11eb-9230-ba8557764eb4.png)

Let's run the test suite to make sure everything is working as expected (you can keep the dev server running and start this in a second terminal window):

```bash
yarn rw test
```

The `test` command starts a persistent process which watches for file changes and automatically runs any tests associated with the changed file(s) (changing a component *or* its tests will trigger a test run).

Since we just started the suite, and we haven't changed any files yet, it may not actually run any tests at all. Hit `a` to tell it run **a**ll tests and we should get a passing suite:

![image](https://user-images.githubusercontent.com/300/153299412-ba191f0b-27bf-4e56-8d23-fb462a4c69c9.png)

If you started with your own repo from Part 1 you may see some failures here: we made a lot of changes to the pages, components and cells we generated, but didn't update the tests to reflect the changes we made. (Another reason to start with the [example repo](#using-the-example-repo)!)

To switch back to the default mode where test are **o**nly run for changed files, press `o` now (or quit and restart `yarn rw test`).

More on testing later, but for now just know that this is always what we want to aim for—all green in that left column. In fact best practices tell us you should not even commit any code to your repo unless the test suite passes locally. Not everyone adheres to this policy quite as strictly as others...*&lt;cough, cough&gt;*
