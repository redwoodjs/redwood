# Hammer 🔨

_by Tom Preston-Werner and Peter Pistorius._

**WARNING:** This document is aspirational (see [Readme Driven
Development](https://tom.preston-werner.com/2010/08/23/readme-driven-development.html))
and not everything contained within it is true yet.

**EXAMPLE:** If you'd like to see some examples of what a Hammer application
might look like (these are still very much works in progress), take a look at
the following projects:

- [Todo](https://github.com/hammerframework/example-todo)
- [Blog](https://github.com/hammerframework/example-blog)
- [Invoice](https://github.com/hammerframework/example-invoice)

**Hammer is an opinionated, full stack, serverless web application framework
that will allow you to build JAMstack applications with ease.** By making a lot
of decisions for you, Hammer lets you get to work on what makes your application
special, instead of wasting cycles choosing and re-choosing various technology
components.

Here's a quick taste of the technologies a standard Hammer application will use:

- Babel
- React
- GraphQL
- Prisma Photon
- JSX
- Styled Components
- React Router
- Apollo
- Prisma Lift
- GraphQL Nexus
- Storybook

## The Hammer philosophy

Hammer believes that JAMstack is a huge leap forward in how we can write web
applications that are easy to write, deploy, scale, and maintain.

Hammer believes that there is power in standards, and makes decisions for you
about what technologies to use, how to organize your code into files, and how to
name things. With a shared understanding of the Hammer conventions, a developer
should be able to jump into any Hammer application and get up to speed very
quickly.

Hammer believes that traditional, relational databases like PostgresQL and MySQL
are still workhorses of today's web applications and should be first-class
citizens. However, that does not mean that Hammer doesn't shine with NoSQL or
other types of "web scale" databases.

Hammer believes that, as much as possible, you should be able to operate in a
serverless mindset and deploy to a generic computational grid. This helps unlock
the next point...

Hammer believes that deployment and scaling should be super easy. To deploy your
application, you should only need to commit and push to your Git repository. To
scale from zero to thousands of users should not require your intervention. The
principles of JAMstack make this possible.

Hammer believes that it should be equally useful for writing both simple, toy
applications, and complex, mission critical applications. In addition, it should
require very little operational work to grow your app from the former to the
latter.

Hammer believes that you can use JavaScript as your primary language on both the
frontend and backend. Only needing a single language simplifies everything from
code reuse to hiring developers.

## How it works

A Hammer application is split into two parts: a frontend and a backend. This is
represented as two node projects within a single monorepo. We use Yarn to make
it easy to operate across both projects, while still keeping them in a single
Git repository.

The frontend project is called `web` and the backend project is called `api`.
For clarity, we will refer to these in prose as "sides", i.e. the "web side"
and the "api side". They are separate projects because code on the web side
will end up running in the user's browser while code on the api side will run
on a server somewhere. It is important that you keep this distinction clear in
your mind as you develop your application. The two separate projects are
intended to make this obvious. In addition, separate projects allow for
different dependencies and build processes for each project.

The api side is an implementation of a GraphQL API. Hammer makes it easy to
interact with a database via Prisma's Photon ORM. Code can be organized into
Photon's model classes, which keeps things clean. Photon also provides
first-class migrations that take the pain out of evolving your database schema.

The web side is coded with React. Hammer provides a variety of utility
components designed to make it easy to run queries and mutations against your
GraphQL API. These components also help separate data fetching from rendering so
you can easily test your components and develop them in isolation (enhanced by
using Storybook).

You'll notice that the web side is called "web" and not "frontend". This is
because Hammer conceives of a world where you may have other sides like
"mobile", "cli", etc, all consuming the same GraphQL API and living in the same
monorepo.

## How can it be serverless if it involves a GraphQL API and database?

I'm glad you asked! Currently, Hammer can deploy your GraphQL API to a Lambda
function. This is not appropriate for all use-cases, but on hosting providers
like Netlify, it makes deployment a breeze. As time goes on, "functions" will
continue to enjoy performance improvements which will further increase the
number of use-cases that can take advantage of this technology.

Databases are a little trickier, especially for the traditional relational ones
like PostgresQL and MySQL. Right now, you still need to set these up manually,
but we are working hard with Netlify and other providers to fulfil the
serverless dream here too.

Hammer is intentionally pushing the boundaries of what's possible with JAMstack.
In fact, the whole reason I (Tom) started working on Hammer is because of a
tweet I posted some time ago:

> Prediction: within 5 years, you’ll build your next large scale, fully featured
> web app with #JAMstack and deploy on @Netlify. [—@mojombo • 9 July
> 2018](https://twitter.com/mojombo/status/1016506622477135872)

I kept waiting for a high quality full-stack framework to arrive, but it didn't,
so I decided to take matters into my own hands. And that's why Hammer exists.

If you are like minded, then I hope you'll join me in helping build Hammer and
hasten the arrival of the future I predicted!

## Why is it called Hammer?

_(A history, by Tom Preson-Werner)_

When I first started working on Hammer, I was listening to Neil Gaimain's Norse
Mythology audiobook. With Neil himself providing the voice, it is truly one of
the most wonderful listening experiences I have had, and I can't recommend it
highly enough.

One of the Norse myths involves the origin story of Thor's hammer. In short,
Loki decides it would be funny to shave off the beautiful golden hair of Thor's
wife, Sif. Thor finds out it was Loki, and demands he fix it or he will break
every one of his bones. Loki knows some dwarves that can forge a replacement for
Sif's hair and tricks them into a competition with another set of dwarves to
each create better gifts for the gods. Among the gifts, the sons of Yvaldi
deliver the ever-growing perfect golden hair for Sif and the team of Brock and
Atri produce their masterwork: a hammer for Thor.

Thor's hammer is called Mjollnir and has properties that I thought would be
aspirational for my nascent web app framework. Namely:

- **Mjollnir is unbreakable.** Wouldn't it be nice if your web app had this
  property?

- **When thrown, it will never miss its target.** Again, you'd be in good shape
  if your web application always hit the mark!

- **No matter how far it's thrown, it will always return.** Quite appropriate
  for a client/server model, don't you think? Robust enough for every request to
  generate a response.

- **You can grow or shrink Mjollnir as needed.** As mentioned in the philosophy
  section, I wanted my framework to be a pleasure for both large and small
  projects alike. Just like Thor's hammer! This also works when talking about
  the auto-scaling features that serverless JAMstack enables. Double whammy!

At the same time, I'd been learning German. The German word Hammer means, well,
hammer. German is funny that way. Or should I say, English is funny that way.
But Germans also use Hammer as slang for "awesome". Therefore, I thought it
would be amusing to be able to say...Hammer ist Hammer. To say this properly,
pronounce Hammer in the proper German way, which is more like "HAH-muh".
Coincidentally, this is also exactly how Neil Gaiman pronounces it with his
British accent. =)

And there you have it.
