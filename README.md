<p align="center">
  <img src="https://avatars2.githubusercontent.com/u/45050444?v=4" width="200" />
  <h1 align="center">Redwood</h1>
</p>

_by Tom Preston-Werner, Peter Pistorius, Rob Cameron, David Price, and more than two hundred amazing contributors (see end of file for a full list)._

**Redwood is an opinionated, full-stack, serverless web application framework
that will allow you to build and deploy JAMstack applications with ease.**
Imagine a React frontend, statically delivered by CDN, that talks via GraphQL to
your backend running on AWS Lambdas around the world, all deployable with just a
`git push`—that's Redwood. By making a lot of decisions for you, Redwood lets
you get to work on what makes your application special, instead of wasting
cycles choosing and re-choosing various technologies and configurations. Plus,
because Redwood is a proper framework, you benefit from continued performance
and feature upgrades over time and with minimum effort.

Redwood is the latest open source project initiated by Tom Preston-Werner, cofounder of GitHub (most popular code host on the planet), creator of Jekyll (one of the first and most popular static site generators), creator of Gravatar (the most popular avatar service on the planet), author of the Semantic Versioning specification (powers the Node packaging ecosystem), and inventor of TOML (an obvious, minimal configuration language used by many projects).

> **NOTICE:** RedwoodJS is very close to a stable version 1.0. In the last two years,
> the project has matured significantly and is already used in production by a number
> of startups. We intend to have a 1.0 release candidate before the end of 2021 and
> to release a truly production-ready 1.0 in early 2022.

> **TUTORIAL:** The best way to get to know Redwood is by going through the extensive
> [Redwood Tutorial](https://redwoodjs.com/tutorial). Have fun!

> **QUICK START:** You can install and run a full-stack Redwood application on your
> machine with only a couple commands. Check out the [Quick Start](https://redwoodjs.com/docs/quick-start)
> guide to get started.

**EXAMPLES:** If you'd like to see some examples of what a Redwood application looks
like, take a look at the following projects:

- [Todo](https://github.com/redwoodjs/example-todo)
- [Blog](https://github.com/redwoodjs/example-blog)
- [Invoice](https://github.com/redwoodjs/example-invoice)

## Technologies

We are obsessed with developer experience and eliminating as much boilerplate as
possible. Where existing libraries elegantly solve our problems, we use them;
where they don't, we write our own solutions. The end result is a JavaScript
development experience you can fall in love with!

Here's a quick taste of the technologies a standard Redwood application will
use:

- [React](https://reactjs.org/)
- [GraphQL](https://graphql.org/) ([GraphQL Helix](https://github.com/contrawork/graphql-helix) + [Envelop](https://www.envelop.dev) + [Apollo Client](https://www.apollographql.com/docs/react))
- [Prisma](https://www.prisma.io/)
- [Jest](https://jestjs.io/)
- [Storybook](https://storybook.js.org/)
- [Babel](https://babeljs.io/)
- [Webpack](https://webpack.js.org/)
- [Pino](https://getpino.io)

## Features

- Opinionated defaults for formatting, file organization, webpack, Babel, and more.
- Simple but powerful routing (all routes defined in one file) with dynamic (typed) parameters, constraints, and named route functions (to generate correct URLs).
- Automatic page-based code-splitting.
- Boilerplate-less GraphQL API construction.
- Cells: a declarative way to fetch data from the backend API.
- Generators for pages, layouts, cells, SDL, services, etc.
- Scaffold generator for CRUD operations around a specific DB table.
- Forms with easy client- and/or server-side validation and error handling.
- [Hot module replacement](https://webpack.js.org/concepts/hot-module-replacement/) (HMR) for faster development.
- Database migrations (via Prisma 2).
- [Envelop Plugins](https://www.envelop.dev) that enhance the GraphQL lifecycle from context to execution
- Simple but powerful GraphQL Directives to validate access or transform resolved data
- Logging using [Pino](https://getpino.io) including to [transports](https://getpino.io/#/docs/transports)
- Signature verification and payload signing for handling incoming and outgoing Webhooks
- Page prerendering
- First class JAMstack-style deployment to [Netlify](https://www.netlify.com/), [Vercel](https://vercel.com/), [Render](https://render.com/), and [Serverless](https://www.serverless.com/).

## Roadmap

We intend to have a 1.0 release candidate before the end of 2021 and to release a truly production-ready 1.0 in early 2022.
To see all the features we plan on including in Redwood's first major release, you can check out our [Roadmap](https://redwoodjs.com/roadmap).

A framework like Redwood has a lot of moving parts; the Roadmap is a great way to get a high-level overview of where the framework is relative to where we want it to be. And since we link to all of our GitHub project boards, it's also a great way to get involved!

## The Redwood philosophy

Redwood believes that [JAMstack](https://jamstack.org/) is a huge leap forward in how we can write web
applications that are easy to write, deploy, scale, and maintain.

Redwood believes that there is power in standards, and makes decisions for you
about which technologies to use, how to organize your code into files, and how to
name things. With a shared understanding of the Redwood conventions, a developer
should be able to jump into any Redwood application and get up to speed very
quickly.

Redwood believes that traditional, relational databases like PostgreSQL and
MySQL are still the workhorses of today's web applications and should be first-class
citizens. However, Redwood also shines with NoSQL databases like [FaunaDB](https://fauna.com/).

Redwood believes that, as much as possible, you should be able to operate in a
serverless mindset and deploy to a generic computational grid. This helps unlock
the next point...

Redwood believes that deployment and scaling should be super easy. To deploy
your application, you should only need to commit and push to your Git
repository. To scale from zero to thousands of users should not require your
intervention. The principles of JAMstack and serverless make this possible.

Redwood believes that it should be equally useful for writing both simple, toy
applications and complex, mission-critical applications. In addition, it should
require very little operational work to grow your app from the former to the
latter.

Redwood believes that you can use JavaScript as your primary language on both
the frontend and backend. Using a single language simplifies everything
from code reuse to hiring developers.

## How it works

A Redwood application is split into two parts: a frontend and a backend. This is
represented as two node projects within a single monorepo. We use [Yarn](https://yarnpkg.com/) to make
it easy to operate across both projects while keeping them in a single
Git repository.

The frontend project is called `web` and the backend project is called `api`.
For clarity, we will refer to these in prose as "sides", i.e. the "web side" and
the "api side". They are separate projects because code on the web side will end
up running in the user's browser while code on the api side will run on a server
somewhere. It is important that you keep this distinction clear in your mind as
you develop your application. The two separate projects are intended to make
this obvious. In addition, separate projects allow for different dependencies
and build processes for each project.

The api side is an implementation of a GraphQL API. Your business logic is
organized into "services" that represent their own internal API and can be
called both from external GraphQL requests and other internal services. Redwood
can automatically connect your internal services with Apollo, reducing the
amount of boilerplate you have to write. Your services can interact with a
database via Prisma's ORM, and Prisma's migration tooling provides first-class
migrations that take the pain out of evolving your database schema.

The web side is built with React. Redwood's router makes it simple to map URL
paths to React "Page" components (and automatically code-split your app on each
route). Pages may contain a "Layout" component to wrap content. They also
contain "Cells" and regular React components. Cells allow you to declaratively
manage the lifecycle of a component that fetches and displays data. Other
Redwood utility components make it trivial to implement smart forms and various
common needs. An ideal development flow starts with Storybook entries and Jest
tests, so Redwood closely integrates both, making it easy to do the right thing.

You'll notice that the web side is called "web" and not "frontend". This is
because Redwood conceives of a world where you may have other sides like
"mobile", "desktop", "cli", etc., all consuming the same GraphQL API and living
in the same monorepo.

## How can it be serverless if it involves a GraphQL API and database?

I'm glad you asked! Currently, Redwood can deploy your GraphQL API to a Lambda
function. This is not appropriate for all use cases, but on hosting providers
like Netlify, it makes deployment a breeze. As time goes on, "functions" will
continue to enjoy performance improvements which will further increase the
number of use cases that can take advantage of this technology.

Databases are a little trickier, especially the traditional relational ones
like PostgreSQL and MySQL. Right now, you still need to set these up manually,
but we are working hard with Netlify and other providers to fulfill the
serverless dream here too.

Redwood is intentionally pushing the boundaries of what's possible with
JAMstack. In fact, the whole reason I (Tom) started working on Redwood is
because of a tweet I posted some time ago:

> Prediction: within 5 years, you’ll build your next large scale, fully featured
> web app with #JAMstack and deploy on @Netlify.
> [—@mojombo • 9 July 2018](https://twitter.com/mojombo/status/1016506622477135872)

I kept waiting for a high quality full-stack framework to arrive, but it didn't,
so I decided to take matters into my own hands. And that's why Redwood exists.

If you are like minded, then I hope you'll join me in helping build Redwood and
hasten the arrival of the future I predicted!

## Why is it called Redwood?

_(A history, by Tom Preston-Werner)_

Where I live in Northern California there is a type of tree called a redwood.
Redwoods are HUGE, the tallest in the world, some topping out at 115 meters (380
feet) in height. The eldest of the still-living redwoods sprouted from the
ground an astonishing 3,200 years ago. To stand among them is transcendent.
Sometimes, when I need to think or be creative, I will journey to my favorite
grove of redwoods and walk among these giants, soaking myself in their silent
grandeur.

In addition, Redwoods have a few properties that I thought would be aspirational
for my nascent web app framework. Namely:

- **Redwoods are beautiful as saplings, and grow to be majestic.** What if you
  could feel that way about your web app?

- **Redwood pinecones are dense and surprisingly small.** Can we allow you to
  get more done with less code?

- **Redwood trees are resistant to fire.** Surprisingly robust to disaster
  scenarios, just like a great web framework should be!

- **Redwoods appear complex from afar, but simple up close.** Their branching
  structure provides order and allows for emergent complexity within a simple
  framework. Can a web framework do the same?

And there you have it.

## Contributors
*A gigantic "Thank YOU!" to everyone below who has contributed to one or more Redwood projects: [Framework](https://github.com/redwoodjs/redwood), [Website](https://github.com/redwoodjs/redwoodjs.com) (docs!), and [Create-Redwood Template](https://github.com/redwoodjs/create-redwood-app). 🚀*

### Core Team
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="http://tom.preston-werner.com/"><img src="https://avatars0.githubusercontent.com/u/1?v=4" width="100px;" alt=""/><br /><sub><b>Tom Preston-Werner</b></sub></a><br /><sub>founder, leadership</sub></td>
    <td align="center"><a href="http://peterp.org/"><img src="https://avatars0.githubusercontent.com/u/44849?v=4" width="100px;" alt=""/><br /><sub><b>Peter Pistorius</b></sub></a><br /><sub>founder, leadership</sub></td>
    <td align="center"><a href="http://ridingtheclutch.com/"><img src="https://avatars1.githubusercontent.com/u/300?v=4" width="100px;" alt=""/><br /><sub><b>Rob Cameron</b></sub></a><br /><sub>founder, leadership</sub></td>
    <td align="center"><a href="http://thedavidprice.com/"><img src="https://avatars0.githubusercontent.com/u/2951?v=4" width="100px;" alt=""/><br /><sub><b>David Price</b></sub></a><br /><sub>founder, leadership</sub></td>
    <td align="center"><a href="https://github.com/jtoar"><img src="https://avatars2.githubusercontent.com/u/32992335?v=4" width="100px;" alt=""/><br /><sub><b>Dominic Saadi</b></sub></a><br /><sub>maintainer, advocate</sub></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/RobertBroersma"><img src="https://avatars0.githubusercontent.com/u/4519828?v=4" width="100px;" alt=""/><br /><sub><b>Robert</b></sub></a><br /><sub>maintainer</sub></td>
    <td align="center"><a href="https://github.com/dthyresson"><img src="https://avatars2.githubusercontent.com/u/1051633?v=4" width="100px;" alt=""/><br /><sub><b>David Thyresson</b></sub></a><br /><sub>maintainer, community</sub></td>
    <td align="center"><a href="https://edamame.studio/"><img src="https://avatars0.githubusercontent.com/u/1521877?v=4" width="100px;" alt=""/><br /><sub><b>Daniel Choudhury</b></sub></a><br /><sub>maintainer, community</sub></td>
    <td align="center"><a href="http://tlundberg.com/"><img src="https://avatars1.githubusercontent.com/u/30793?v=4" width="100px;" alt=""/><br /><sub><b>Tobbe Lundberg</b></sub></a><br /><sub>maintainer</sub></td>
    <td align="center"><a href="https://github.com/aldonline"><img src="https://avatars2.githubusercontent.com/u/154884?v=4" width="100px;" alt=""/><br /><sub><b>Aldo Bucchi</b></sub></a><br /><sub>maintainer</sub></td>
</tr>
<tr>
    <td align="center"><a href="https://github.com/ajcwebdev"><img src="https://avatars0.githubusercontent.com/u/12433465?v=4" width="100px;" alt=""/><br /><sub><b>Anthony Campolo</b></sub></a><br /><sub>advocate</sub></td>
    <td align="center"><a href="https://github.com/clairefro"><img src="https://avatars1.githubusercontent.com/u/9841162?v=4" width="100px;" alt=""/><br /><sub><b>Claire Froelich</b></sub></a><br /><sub>maintainer</sub></td>
    <td align="center"><a href="https://github.com/kimadeline"><img src="https://avatars3.githubusercontent.com/u/51720070?v=4" width="100px;" alt=""/><br /><sub><b>Kim-Adeline Miguel</b></sub></a><br /><sub>community</sub></td>
    <td align="center"><a href="https://github.com/forresthayes"><img src="https://avatars0.githubusercontent.com/u/44448047?v=4" width="100px;" alt=""/><br /><sub><b>Forrest Hayes</b></sub></a><br /><sub>community</sub></td>
    <td align="center"><a href="https://simoncrypta.dev/"><img src="https://avatars.githubusercontent.com/u/18013532?v=4" width="100px;" alt=""/><br /><sub><b>Simon Gagnon</b></sub></a><br /><sub>maintainer</sub></td>
</tr>
<tr>
    <td align="center"><a href="http://kriscoulson.com/"><img src="https://avatars3.githubusercontent.com/u/6943688?v=4" width="100px;" alt=""/><br /><sub><b>Kris Coulson</b></sub></a><br /><sub>community</sub></td>
    <td align="center"><a href="https://adityaworks.com/"><img src="https://avatars.githubusercontent.com/u/2629902?v=4" width="100px;" alt=""/><br /><sub><b>Aditya Pandey</b></sub></a><br /><sub>maintainer</sub></td>
    <td align="center"><a href="https://github.com/keithtelliott"><img src="https://avatars.githubusercontent.com/u/43206213?v=4" width="100px;" alt=""/><br /><sub><b>Keith T Elliot</b></sub></a><br /><sub>community</sub></td>
</tr>
</table>
<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

### All Contributors
<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

Redwood projects *(mostly)* follow the [all-contributions](https://allcontributors.org/) specification. Contributions of any kind are welcome.
