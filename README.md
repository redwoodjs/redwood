<p align="center">
  <img src="https://avatars2.githubusercontent.com/u/45050444?v=4" width="200" />
  <h1 align="center">Redwood</h1>
</p>

_by Tom Preston-Werner, Peter Pistorius, Rob Cameron, David Price, and more than
250 amazing contributors (see end of file for a full list)._

**Redwood is an opinionated, full-stack, JavaScript/TypeScript web application
framework designed to keep you moving fast as your app grows from side project
to startup.**

At the highest level, a Redwood app is a React frontend that talks to a custom
GraphQL API. The API uses Prisma to operate on a database. Out of the box you
get tightly integrated testing with Jest, logging with Pino, and a UI component
catalog with Storybook. Setting up authentication (like Auth0) or CSS frameworks
(like Tailwind CSS) are a single command line invocation away. And to top it
off, Redwood's architecture allows you to deploy to either serverless providers
(e.g. Netlify, Vercel) or traditional server and container providers (e.g. AWS,
Render) with nearly no code changes between the two!

By making a lot of decisions for you, Redwood lets you get to work on what makes
your application special, instead of wasting cycles choosing and re-choosing
various technologies and configurations. Plus, because Redwood is a proper
framework, you benefit from continued performance and feature upgrades over time
and with minimum effort.

Redwood is the latest open source project initiated by Tom Preston-Werner,
cofounder of GitHub (most popular code host on the planet), creator of Jekyll
(one of the first and most popular static site generators), creator of Gravatar
(the most popular avatar service on the planet), author of the Semantic
Versioning specification (powers the Node packaging ecosystem), and inventor of
TOML (an obvious, minimal configuration language used by many projects).

> **NOTICE:** RedwoodJS is very close to a stable version 1.0. In the last two
> years, the project has matured significantly and is already used in production
> by a number of VC-backed startups. We are currently in the release candidate
> phase and intend to release a final v1.0.0 in March of 2022.

> **TUTORIAL:** The best way to get to know Redwood is by going through the
> extensive [Redwood Tutorial](https://redwoodjs.com/tutorial). Have fun!

> **QUICK START:** You can install and run a full-stack Redwood application on
> your machine with only a couple commands. Check out the [Quick
> Start](https://redwoodjs.com/docs/quick-start) guide to get started.

**EXAMPLES:** If you'd like to see some simple examples of what a Redwood
application looks like, take a look at the following projects:

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
- [Fastify](https://www.fastify.io)
- [Pino](https://getpino.io)

## Features

- Opinionated defaults for formatting, file organization, Webpack, Babel, and more
- Simple but powerful routing (all routes defined in one file) with dynamic (typed) parameters, custom types, and named route functions (to generate correct URLs)
- Automatic page-based code-splitting
- Boilerplate-less GraphQL API construction
- Cells: a declarative way to fetch data from the backend API
- Generators for pages, layouts, cells, SDL, services, etc.
- Scaffold generator for CRUD operations specific to a DB table
- Forms with easy client- and/or server-side validation and error handling
- Fast Refresh (hot reloading) for faster development
- Database and Data migrations
- [Envelop Plugins](https://www.envelop.dev) that enhance the GraphQL lifecycle from context to execution
- Simple but powerful GraphQL Directives to validate access or transform resolved data
- Logging using [Pino](https://getpino.io) including [transports](https://getpino.io/#/docs/transports)
- Webhooks: signature verification and payload signing for handling both incoming and outgoing
- Jest testing utilities integrated across your codebase: mocks, test DB, generated boilerplate tests, scenarios, Web (components), and API (services, serverless functions, and webhooks)
- Page prerendering at build time
- Built-in Storybook integration: generated boilerplate component stories, tests, graphql/api mocks (Cells), and scenarios
- API Server using [Fastify](https://www.fastify.io) for Serverful deploys
- First-class Jamstack-style deployment to both serverless and traditional infrastructure: [Netlify](https://www.netlify.com/), [Vercel](https://vercel.com/), [Serverless](https://www.serverless.com/), [Render](https://render.com/), [Docker container](https://community.redwoodjs.com/t/dockerize-redwoodjs/2291) (for AWS, Google Cloud, Azure, etc.), and many more on the way!

## How it works

A Redwood application is split into two parts: a frontend and a backend. This is
represented as two JS/TS projects within a single monorepo. We use
[Yarn](https://yarnpkg.com/) to make it easy to operate across both projects
while keeping them in a single Git repository.

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

## Roadmap

We intend to release a truly production-ready 1.0 in early 2022. To see all the
features we plan on including in Redwood's first major release, you can check
out our [Roadmap](https://redwoodjs.com/roadmap).

A framework like Redwood has a lot of moving parts; the Roadmap is a great way
to get a high-level overview of where the framework is relative to where we want
it to be. And since we link to all of our GitHub project boards, it's also a
great way to get involved!

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
    <td align="center"><a href="https://github.com/agiannelli"><img src="https://avatars.githubusercontent.com/u/53096355?v=4" width="100px;" alt=""/><br /><sub><b>Amanda Giannelli</b></sub></a><br /><sub>community</sub></td>
</tr>
</table>
<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

### All Contributors
<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="http://antonmoiseev.com/"><img src="https://avatars0.githubusercontent.com/u/182853?v=4" width="100px;" alt=""/><br /><sub><b>Anton Moiseev</b></sub></a></td>
    <td align="center"><a href="https://azimi.me/"><img src="https://avatars0.githubusercontent.com/u/543633?v=4" width="100px;" alt=""/><br /><sub><b>Mohsen Azimi</b></sub></a></td>
    <td align="center"><a href="http://tapstudio.co.uk/"><img src="https://avatars1.githubusercontent.com/u/15834048?v=4" width="100px;" alt=""/><br /><sub><b>Christopher Burns</b></sub></a></td>
    <td align="center"><a href="http://terrisjkremer.com/"><img src="https://avatars0.githubusercontent.com/u/458233?v=4" width="100px;" alt=""/><br /><sub><b>Terris Kremer</b></sub></a></td>
    <td align="center"><a href="https://ghuser.io/jamesgeorge007"><img src="https://avatars2.githubusercontent.com/u/25279263?v=4" width="100px;" alt=""/><br /><sub><b>James George</b></sub></a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://brettjackson.org/"><img src="https://avatars0.githubusercontent.com/u/47246?v=4" width="100px;" alt=""/><br /><sub><b>Brett Jackson</b></sub></a></td>
    <td align="center"><a href="https://github.com/gfpacheco"><img src="https://avatars0.githubusercontent.com/u/3705660?v=4" width="100px;" alt=""/><br /><sub><b>Guilherme Pacheco</b></sub></a></td>
    <td align="center"><a href="https://github.com/noire-munich"><img src="https://avatars2.githubusercontent.com/u/10271407?v=4" width="100px;" alt=""/><br /><sub><b>noire.munich</b></sub></a></td>
    <td align="center"><a href="http://kasper.io/"><img src="https://avatars0.githubusercontent.com/u/230404?v=4" width="100px;" alt=""/><br /><sub><b>Kasper Mikiewicz</b></sub></a></td>
    <td align="center"><a href="https://github.com/chris-hailstorm"><img src="https://avatars0.githubusercontent.com/u/1454260?v=4" width="100px;" alt=""/><br /><sub><b>chris-hailstorm</b></sub></a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/Jaikant"><img src="https://avatars2.githubusercontent.com/u/3472565?v=4" width="100px;" alt=""/><br /><sub><b>Jai</b></sub></a></td>
    <td align="center"><a href="https://lachlanjc.com/"><img src="https://avatars1.githubusercontent.com/u/5074763?v=4" width="100px;" alt=""/><br /><sub><b>Lachlan Campbell</b></sub></a></td>
    <td align="center"><a href="https://satyarohith.com/"><img src="https://avatars2.githubusercontent.com/u/29819102?v=4" width="100px;" alt=""/><br /><sub><b>Satya Rohith</b></sub></a></td>
    <td align="center"><a href="http://twitter.com/snormore"><img src="https://avatars1.githubusercontent.com/u/182290?v=4" width="100px;" alt=""/><br /><sub><b>Steven Normore</b></sub></a></td>
    <td align="center"><a href="https://github.com/Rosenberg96"><img src="https://avatars2.githubusercontent.com/u/22986012?v=4" width="100px;" alt=""/><br /><sub><b>Mads Rosenberg</b></sub></a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/tedstoychev"><img src="https://avatars1.githubusercontent.com/u/1466111?v=4" width="100px;" alt=""/><br /><sub><b>Ted Stoychev</b></sub></a></td>
    <td align="center"><a href="https://github.com/eurobob"><img src="https://avatars1.githubusercontent.com/u/4255350?v=4" width="100px;" alt=""/><br /><sub><b>eurobob</b></sub></a></td>
    <td align="center"><a href="https://github.com/vikash-eatgeek"><img src="https://avatars2.githubusercontent.com/u/50338945?v=4" width="100px;" alt=""/><br /><sub><b>Vikash</b></sub></a></td>
    <td align="center"><a href="http://adrianmato.com/"><img src="https://avatars0.githubusercontent.com/u/589285?v=4" width="100px;" alt=""/><br /><sub><b>Adrian Mato</b></sub></a></td>
    <td align="center"><a href="https://github.com/ackinc"><img src="https://avatars2.githubusercontent.com/u/4007598?v=4" width="100px;" alt=""/><br /><sub><b>Anirudh Nimmagadda</b></sub></a></td>
  </tr>
  <tr>
    <td align="center"><a href="http://www.benmccann.com/"><img src="https://avatars3.githubusercontent.com/u/322311?v=4" width="100px;" alt=""/><br /><sub><b>Ben McCann</b></sub></a></td>
    <td align="center"><a href="https://github.com/cball"><img src="https://avatars1.githubusercontent.com/u/14339?v=4" width="100px;" alt=""/><br /><sub><b>Chris Ball</b></sub></a></td>
    <td align="center"><a href="https://github.com/suvash"><img src="https://avatars3.githubusercontent.com/u/144952?v=4" width="100px;" alt=""/><br /><sub><b>Suvash Thapaliya</b></sub></a></td>
    <td align="center"><a href="https://github.com/Thieffen"><img src="https://avatars1.githubusercontent.com/u/847877?v=4" width="100px;" alt=""/><br /><sub><b>Thieffen Delabaere</b></sub></a></td>
    <td align="center"><a href="https://twitter.com/swyx"><img src="https://avatars1.githubusercontent.com/u/6764957?v=4" width="100px;" alt=""/><br /><sub><b>swyx</b></sub></a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://maxleon.net/"><img src="https://avatars1.githubusercontent.com/u/745236?v=4" width="100px;" alt=""/><br /><sub><b>Max Leon</b></sub></a></td>
    <td align="center"><a href="https://github.com/maximgeerinck"><img src="https://avatars1.githubusercontent.com/u/615509?v=4" width="100px;" alt=""/><br /><sub><b>Maxim Geerinck</b></sub></a></td>
    <td align="center"><a href="https://twitter.com/nexneo"><img src="https://avatars2.githubusercontent.com/u/794?v=4" width="100px;" alt=""/><br /><sub><b>Niket Patel</b></sub></a></td>
    <td align="center"><a href="https://github.com/0xflotus"><img src="https://avatars3.githubusercontent.com/u/26602940?v=4" width="100px;" alt=""/><br /><sub><b>0xflotus</b></sub></a></td>
    <td align="center"><a href="https://github.com/cephalization"><img src="https://avatars1.githubusercontent.com/u/8948924?v=4" width="100px;" alt=""/><br /><sub><b>Anthony Powell</b></sub></a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://thewebdevcoach.com/"><img src="https://avatars3.githubusercontent.com/u/8263430?v=4" width="100px;" alt=""/><br /><sub><b>Aryan J</b></sub></a></td>
    <td align="center"><a href="http://www.brianketelsen.com/"><img src="https://avatars1.githubusercontent.com/u/37492?v=4" width="100px;" alt=""/><br /><sub><b>Brian Ketelsen</b></sub></a></td>
    <td align="center"><a href="https://github.com/dominicchapman"><img src="https://avatars2.githubusercontent.com/u/7607007?v=4" width="100px;" alt=""/><br /><sub><b>Dominic Chapman</b></sub></a></td>
    <td align="center"><a href="https://github.com/evanmoncuso"><img src="https://avatars3.githubusercontent.com/u/12928071?v=4" width="100px;" alt=""/><br /><sub><b>Evan Moncuso</b></sub></a></td>
    <td align="center"><a href="https://github.com/petukhov"><img src="https://avatars1.githubusercontent.com/u/2112710?v=4" width="100px;" alt=""/><br /><sub><b>Georgy Petukhov</b></sub></a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/leibowitz"><img src="https://avatars0.githubusercontent.com/u/1508563?v=4" width="100px;" alt=""/><br /><sub><b>Gianni Moschini</b></sub></a></td>
    <td align="center"><a href="https://github.com/gielcobben"><img src="https://avatars0.githubusercontent.com/u/2663212?v=4" width="100px;" alt=""/><br /><sub><b>Giel</b></sub></a></td>
    <td align="center"><a href="https://github.com/janimo"><img src="https://avatars2.githubusercontent.com/u/50138?v=4" width="100px;" alt=""/><br /><sub><b>Jani Monoses</b></sub></a></td>
    <td align="center"><a href="https://github.com/jeliasson"><img src="https://avatars2.githubusercontent.com/u/865493?v=4" width="100px;" alt=""/><br /><sub><b>Johan Eliasson</b></sub></a></td>
    <td align="center"><a href="https://github.com/leonardoelias"><img src="https://avatars2.githubusercontent.com/u/1995213?v=4" width="100px;" alt=""/><br /><sub><b>Leonardo Elias</b></sub></a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://loganhoup.com/"><img src="https://avatars0.githubusercontent.com/u/17230438?v=4" width="100px;" alt=""/><br /><sub><b>Logan Houp</b></sub></a></td>
    <td align="center"><a href="http://lorensr.me/"><img src="https://avatars2.githubusercontent.com/u/251288?v=4" width="100px;" alt=""/><br /><sub><b>Loren ☺️</b></sub></a></td>
    <td align="center"><a href="https://markpollmann.com/"><img src="https://avatars2.githubusercontent.com/u/5286559?v=4" width="100px;" alt=""/><br /><sub><b>Mark Pollmann</b></sub></a></td>
    <td align="center"><a href="https://github.com/mattleff"><img src="https://avatars0.githubusercontent.com/u/120155?v=4" width="100px;" alt=""/><br /><sub><b>Matthew Leffler</b></sub></a></td>
    <td align="center"><a href="https://github.com/michelegera"><img src="https://avatars1.githubusercontent.com/u/3891?v=4" width="100px;" alt=""/><br /><sub><b>Michele Gerarduzzi</b></sub></a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://www.nickgilldev.com/"><img src="https://avatars1.githubusercontent.com/u/42254038?v=4" width="100px;" alt=""/><br /><sub><b>Nick Gill</b></sub></a></td>
    <td align="center"><a href="https://github.com/nhristov"><img src="https://avatars1.githubusercontent.com/u/59096521?v=4" width="100px;" alt=""/><br /><sub><b>Nicholas Joy Christ</b></sub></a></td>
    <td align="center"><a href="http://www.getalma.eu/"><img src="https://avatars0.githubusercontent.com/u/314079?v=4" width="100px;" alt=""/><br /><sub><b>Olivier Lance</b></sub></a></td>
    <td align="center"><a href="https://github.com/dnprock"><img src="https://avatars2.githubusercontent.com/u/497205?v=4" width="100px;" alt=""/><br /><sub><b>Phuoc Do</b></sub></a></td>
    <td align="center"><a href="https://github.com/rockymeza"><img src="https://avatars1.githubusercontent.com/u/21784?v=4" width="100px;" alt=""/><br /><sub><b>Rocky Meza</b></sub></a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/sharcastic"><img src="https://avatars1.githubusercontent.com/u/11964820?v=4" width="100px;" alt=""/><br /><sub><b>Sharan Kumar S</b></sub></a></td>
    <td align="center"><a href="https://github.com/SimeonGriggs"><img src="https://avatars0.githubusercontent.com/u/9684022?v=4" width="100px;" alt=""/><br /><sub><b>Simeon Griggs</b></sub></a></td>
    <td align="center"><a href="http://taylormilliman.me/"><img src="https://avatars3.githubusercontent.com/u/15217013?v=4" width="100px;" alt=""/><br /><sub><b>Taylor Milliman</b></sub></a></td>
    <td align="center"><a href="https://github.com/zhammer"><img src="https://avatars0.githubusercontent.com/u/6956487?v=4" width="100px;" alt=""/><br /><sub><b>Zach Hammer</b></sub></a></td>
    <td align="center"><a href="https://github.com/biphobe"><img src="https://avatars2.githubusercontent.com/u/1573875?v=4" width="100px;" alt=""/><br /><sub><b>Przemyslaw T</b></sub></a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://hd10.dev/"><img src="https://avatars2.githubusercontent.com/u/8195444?v=4" width="100px;" alt=""/><br /><sub><b>Hemil Desai</b></sub></a></td>
    <td align="center"><a href="https://github.com/MontelAle"><img src="https://avatars0.githubusercontent.com/u/38809793?v=4" width="100px;" alt=""/><br /><sub><b>Alessio Montel</b></sub></a></td>
    <td align="center"><a href="https://anthonymorris.dev/"><img src="https://avatars2.githubusercontent.com/u/16005567?v=4" width="100px;" alt=""/><br /><sub><b>Anthony Morris</b></sub></a></td>
    <td align="center"><a href="https://betocmn.com/"><img src="https://avatars3.githubusercontent.com/u/1548368?v=4" width="100px;" alt=""/><br /><sub><b>Beto</b></sub></a></td>
    <td align="center"><a href="http://turadg.aleahmad.net/"><img src="https://avatars1.githubusercontent.com/u/21505?v=4" width="100px;" alt=""/><br /><sub><b>Turadg Aleahmad</b></sub></a></td>
  </tr>
  <tr>
    <td align="center"><a href="http://www.paulkarayan.com/"><img src="https://avatars3.githubusercontent.com/u/1227327?v=4" width="100px;" alt=""/><br /><sub><b>Paul Karayan</b></sub></a></td>
    <td align="center"><a href="https://twitter.com/nikolasburk"><img src="https://avatars1.githubusercontent.com/u/4058327?v=4" width="100px;" alt=""/><br /><sub><b>Nikolas</b></sub></a></td>
    <td align="center"><a href="https://github.com/guledali"><img src="https://avatars1.githubusercontent.com/u/20647282?v=4" width="100px;" alt=""/><br /><sub><b>guledali</b></sub></a></td>
    <td align="center"><a href="https://yongbakos.com/"><img src="https://avatars2.githubusercontent.com/u/5502?v=4" width="100px;" alt=""/><br /><sub><b>Yong Joseph Bakos</b></sub></a></td>
    <td align="center"><a href="http://www.engawa.de/"><img src="https://avatars0.githubusercontent.com/u/3391068?v=4" width="100px;" alt=""/><br /><sub><b>Gerd Jungbluth</b></sub></a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/JamesHighsmith"><img src="https://avatars1.githubusercontent.com/u/2617706?v=4" width="100px;" alt=""/><br /><sub><b>James Highsmith</b></sub></a></td>
    <td align="center"><a href="http://tmr08c.github.io/"><img src="https://avatars1.githubusercontent.com/u/691365?v=4" width="100px;" alt=""/><br /><sub><b>Troy Rosenberg</b></sub></a></td>
    <td align="center"><a href="http://amrrkf.wordpress.com/"><img src="https://avatars3.githubusercontent.com/u/8496156?v=4" width="100px;" alt=""/><br /><sub><b>Amr Fahim</b></sub></a></td>
    <td align="center"><a href="https://github.com/dfundingsland"><img src="https://avatars3.githubusercontent.com/u/10798234?v=4" width="100px;" alt=""/><br /><sub><b>dfundingsland</b></sub></a></td>
    <td align="center"><a href="https://www.osiux.ws/"><img src="https://avatars2.githubusercontent.com/u/204463?v=4" width="100px;" alt=""/><br /><sub><b>Eduardo Reveles</b></sub></a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://archive.org/download/cv_20200213"><img src="https://avatars2.githubusercontent.com/u/388761?v=4" width="100px;" alt=""/><br /><sub><b>Jeffrey Horn</b></sub></a></td>
    <td align="center"><a href="https://github.com/matthewhembree"><img src="https://avatars2.githubusercontent.com/u/47449406?v=4" width="100px;" alt=""/><br /><sub><b>matthewhembree</b></sub></a></td>
    <td align="center"><a href="https://robertbolender.com/"><img src="https://avatars2.githubusercontent.com/u/3677807?v=4" width="100px;" alt=""/><br /><sub><b>Robert Bolender</b></sub></a></td>
    <td align="center"><a href="https://github.com/shivamsinghchahar"><img src="https://avatars0.githubusercontent.com/u/16636757?v=4" width="100px;" alt=""/><br /><sub><b>Shivam Chahar</b></sub></a></td>
    <td align="center"><a href="https://www.aaronsumner.com/"><img src="https://avatars1.githubusercontent.com/u/53491?v=4" width="100px;" alt=""/><br /><sub><b>Aaron Sumner</b></sub></a></td>
  </tr>
  <tr>
    <td align="center"><a href="http://alvincrespo.com/"><img src="https://avatars0.githubusercontent.com/u/151311?v=4" width="100px;" alt=""/><br /><sub><b>Alvin Crespo</b></sub></a></td>
    <td align="center"><a href="https://github.com/csellis"><img src="https://avatars1.githubusercontent.com/u/814405?v=4" width="100px;" alt=""/><br /><sub><b>Chris Ellis</b></sub></a></td>
    <td align="center"><a href="https://colinscape.com/"><img src="https://avatars3.githubusercontent.com/u/1083708?v=4" width="100px;" alt=""/><br /><sub><b>Colin Ross</b></sub></a></td>
    <td align="center"><a href="https://dangdennis.com/"><img src="https://avatars3.githubusercontent.com/u/22418429?v=4" width="100px;" alt=""/><br /><sub><b>Dennis Dang</b></sub></a></td>
    <td align="center"><a href="https://github.com/derrickpelletier"><img src="https://avatars1.githubusercontent.com/u/833426?v=4" width="100px;" alt=""/><br /><sub><b>Derrick Pelletier</b></sub></a></td>
  </tr>
  <tr>
    <td align="center"><a href="http://www.jvanbaarsen.com/"><img src="https://avatars1.githubusercontent.com/u/1362793?v=4" width="100px;" alt=""/><br /><sub><b>Jeroen van Baarsen</b></sub></a></td>
    <td align="center"><a href="https://github.com/matchai"><img src="https://avatars0.githubusercontent.com/u/4658208?v=4" width="100px;" alt=""/><br /><sub><b>Matan Kushner</b></sub></a></td>
    <td align="center"><a href="http://blog.matthewrathbone.com/"><img src="https://avatars2.githubusercontent.com/u/279769?v=4" width="100px;" alt=""/><br /><sub><b>Matthew Rathbone</b></sub></a></td>
    <td align="center"><a href="https://zurda.github.io/portfolio/"><img src="https://avatars2.githubusercontent.com/u/16784959?v=4" width="100px;" alt=""/><br /><sub><b>Michal Weisman</b></sub></a></td>
    <td align="center"><a href="https://twitter.com/ollermi"><img src="https://avatars3.githubusercontent.com/u/5677929?v=4" width="100px;" alt=""/><br /><sub><b>Miguel Oller</b></sub></a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://mudssrali.github.io/"><img src="https://avatars0.githubusercontent.com/u/24487349?v=4" width="100px;" alt=""/><br /><sub><b>Mudassar Ali</b></sub></a></td>
    <td align="center"><a href="https://n8finch.com/"><img src="https://avatars0.githubusercontent.com/u/7983116?v=4" width="100px;" alt=""/><br /><sub><b>Nate Finch</b></sub></a></td>
    <td align="center"><a href="https://github.com/pavelloz"><img src="https://avatars1.githubusercontent.com/u/546845?v=4" width="100px;" alt=""/><br /><sub><b>Paweł Kowalski</b></sub></a></td>
    <td align="center"><a href="https://in.linkedin.com/in/punit-makwana/"><img src="https://avatars1.githubusercontent.com/u/16760252?v=4" width="100px;" alt=""/><br /><sub><b>Punit Makwana</b></sub></a></td>
    <td align="center"><a href="http://scottchacon.com/"><img src="https://avatars0.githubusercontent.com/u/70?v=4" width="100px;" alt=""/><br /><sub><b>Scott Chacon</b></sub></a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/scotato"><img src="https://avatars2.githubusercontent.com/u/5290015?v=4" width="100px;" alt=""/><br /><sub><b>scott</b></sub></a></td>
    <td align="center"><a href="https://github.com/swalkinshaw"><img src="https://avatars3.githubusercontent.com/u/295605?v=4" width="100px;" alt=""/><br /><sub><b>Scott Walkinshaw</b></sub></a></td>
    <td align="center"><a href="https://github.com/stephanvd"><img src="https://avatars1.githubusercontent.com/u/1248040?v=4" width="100px;" alt=""/><br /><sub><b>Stephan van Diepen</b></sub></a></td>
    <td align="center"><a href="https://github.com/bpenno"><img src="https://avatars0.githubusercontent.com/u/10125593?v=4" width="100px;" alt=""/><br /><sub><b>bpenno</b></sub></a></td>
    <td align="center"><a href="https://github.com/tctrautman"><img src="https://avatars0.githubusercontent.com/u/4513085?v=4" width="100px;" alt=""/><br /><sub><b>Tim Trautman</b></sub></a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://zackmckenna.com/"><img src="https://avatars1.githubusercontent.com/u/31899931?v=4" width="100px;" alt=""/><br /><sub><b>Zachary McKenna</b></sub></a></td>
    <td align="center"><a href="http://ryanhayes.net/"><img src="https://avatars3.githubusercontent.com/u/438357?v=4" width="100px;" alt=""/><br /><sub><b>Ryan Hayes</b></sub></a></td>
    <td align="center"><a href="https://faunadb.com/"><img src="https://avatars0.githubusercontent.com/u/210?v=4" width="100px;" alt=""/><br /><sub><b>Evan Weaver</b></sub></a></td>
    <td align="center"><a href="https://github.com/CR1AT0RS"><img src="https://avatars1.githubusercontent.com/u/4299288?v=4" width="100px;" alt=""/><br /><sub><b>cr1at0rs</b></sub></a></td>
    <td align="center"><a href="https://github.com/qooqu"><img src="https://avatars0.githubusercontent.com/u/23623824?v=4" width="100px;" alt=""/><br /><sub><b>qooqu</b></sub></a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://www.youtube.com/c/awesomedevnotes"><img src="https://avatars2.githubusercontent.com/u/66256957?v=4" width="100px;" alt=""/><br /><sub><b>Android Dev Notes</b></sub></a></td>
    <td align="center"><a href="http://jeremykratz.com/"><img src="https://avatars3.githubusercontent.com/u/1337020?v=4" width="100px;" alt=""/><br /><sub><b>Jeremy Kratz</b></sub></a></td>
    <td align="center"><a href="https://www.aboutmonica.com/"><img src="https://avatars0.githubusercontent.com/u/6998954?v=4" width="100px;" alt=""/><br /><sub><b>Monica Powell</b></sub></a></td>
    <td align="center"><a href="https://github.com/bboygary"><img src="https://avatars0.githubusercontent.com/u/65660344?v=4" width="100px;" alt=""/><br /><sub><b>Ganesh Rane</b></sub></a></td>
    <td align="center"><a href="https://github.com/ryanmdoyle"><img src="https://avatars2.githubusercontent.com/u/20651020?v=4" width="100px;" alt=""/><br /><sub><b>Ryan Doyle</b></sub></a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/matthewcarlreetz"><img src="https://avatars0.githubusercontent.com/u/1760821?v=4" width="100px;" alt=""/><br /><sub><b>Matt Reetz</b></sub></a></td>
    <td align="center"><a href="https://in.linkedin.com/in/punit-makwana/"><img src="https://avatars1.githubusercontent.com/u/16760252?v=4" width="100px;" alt=""/><br /><sub><b>Punit Makwana</b></sub></a></td>
    <td align="center"><a href="https://github.com/shzmr"><img src="https://avatars2.githubusercontent.com/u/55944948?v=4" width="100px;" alt=""/><br /><sub><b>shzmr</b></sub></a></td>
    <td align="center"><a href="https://github.com/esteban-url"><img src="https://avatars0.githubusercontent.com/u/14810250?v=4" width="100px;" alt=""/><br /><sub><b>esteban-url</b></sub></a></td>
    <td align="center"><a href="https://github.com/Irev-Dev"><img src="https://avatars3.githubusercontent.com/u/29681384?v=4" width="100px;" alt=""/><br /><sub><b>Kurt Hutten</b></sub></a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/AntonioMeireles"><img src="https://avatars1.githubusercontent.com/u/743527?v=4" width="100px;" alt=""/><br /><sub><b>António Meireles</b></sub></a></td>
    <td align="center"><a href="https://github.com/brentguf"><img src="https://avatars0.githubusercontent.com/u/16427929?v=4" width="100px;" alt=""/><br /><sub><b>Brent Guffens</b></sub></a></td>
    <td align="center"><a href="http://santhoshle.com/"><img src="https://avatars1.githubusercontent.com/u/23736018?v=4" width="100px;" alt=""/><br /><sub><b>Santhosh Laguduwa</b></sub></a></td>
    <td align="center"><a href="https://github.com/mbucchi"><img src="https://avatars0.githubusercontent.com/u/5379019?v=4" width="100px;" alt=""/><br /><sub><b>Marco Bucchi</b></sub></a></td>
    <td align="center"><a href="https://github.com/jchlu"><img src="https://avatars2.githubusercontent.com/u/496597?v=4" width="100px;" alt=""/><br /><sub><b>Johnny Choudhury-Lucas</b></sub></a></td>
  </tr>
  <tr>
    <td align="center"><a href="http://stevenmichael.almeroth.net/"><img src="https://avatars0.githubusercontent.com/u/204645?v=4" width="100px;" alt=""/><br /><sub><b>Steven Almeroth</b></sub></a></td>
    <td align="center"><a href="https://github.com/lumenCodes"><img src="https://avatars3.githubusercontent.com/u/60603806?v=4" width="100px;" alt=""/><br /><sub><b>lumenCodes</b></sub></a></td>
    <td align="center"><a href="https://robobunny.surge.sh/"><img src="https://avatars2.githubusercontent.com/u/62807704?v=4" width="100px;" alt=""/><br /><sub><b>_robobunny</b></sub></a></td>
    <td align="center"><a href="https://github.com/kevPo"><img src="https://avatars1.githubusercontent.com/u/2813592?v=4" width="100px;" alt=""/><br /><sub><b>Kevin Poston</b></sub></a></td>
    <td align="center"><a href="https://github.com/dhausser"><img src="https://avatars1.githubusercontent.com/u/24432220?v=4" width="100px;" alt=""/><br /><sub><b>Davy Hausser</b></sub></a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/mohinderps"><img src="https://avatars3.githubusercontent.com/u/16372215?v=4" width="100px;" alt=""/><br /><sub><b>Mohinder Saluja</b></sub></a></td>
    <td align="center"><a href="https://github.com/guillaumeLamanda"><img src="https://avatars0.githubusercontent.com/u/10440081?v=4" width="100px;" alt=""/><br /><sub><b>Lamanda </b></sub></a></td>
    <td align="center"><a href="https://github.com/ryancwalsh"><img src="https://avatars2.githubusercontent.com/u/2086493?v=4" width="100px;" alt=""/><br /><sub><b>ryancwalsh</b></sub></a></td>
    <td align="center"><a href="https://github.com/njjkgeerts"><img src="https://avatars0.githubusercontent.com/u/504749?v=4" width="100px;" alt=""/><br /><sub><b>Nick Geerts</b></sub></a></td>
    <td align="center"><a href="https://miku86.com/"><img src="https://avatars3.githubusercontent.com/u/7271016?v=4" width="100px;" alt=""/><br /><sub><b>miku86</b></sub></a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/Krisztiaan"><img src="https://avatars2.githubusercontent.com/u/4700811?v=4" width="100px;" alt=""/><br /><sub><b>Krisztiaan</b></sub></a></td>
    <td align="center"><a href="https://github.com/jderrough"><img src="https://avatars3.githubusercontent.com/u/1108358?v=4" width="100px;" alt=""/><br /><sub><b>Jonathan Derrough</b></sub></a></td>
    <td align="center"><a href="https://github.com/AsdethPrime"><img src="https://avatars0.githubusercontent.com/u/22416004?v=4" width="100px;" alt=""/><br /><sub><b>Asdethprime</b></sub></a></td>
    <td align="center"><a href="https://github.com/solon"><img src="https://avatars2.githubusercontent.com/u/48528?v=4" width="100px;" alt=""/><br /><sub><b>Brian Solon</b></sub></a></td>
    <td align="center"><a href="https://github.com/ccchapman"><img src="https://avatars0.githubusercontent.com/u/42548502?v=4" width="100px;" alt=""/><br /><sub><b>Chris Chapman</b></sub></a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://twitter.com/Jolg42"><img src="https://avatars3.githubusercontent.com/u/1328733?v=4" width="100px;" alt=""/><br /><sub><b>Joël Galeran</b></sub></a></td>
    <td align="center"><a href="https://www.mariahbragg.com/"><img src="https://avatars2.githubusercontent.com/u/5139784?v=4" width="100px;" alt=""/><br /><sub><b>Mariah</b></sub></a></td>
    <td align="center"><a href="https://ogdenstudios.xyz/"><img src="https://avatars2.githubusercontent.com/u/29899554?v=4" width="100px;" alt=""/><br /><sub><b>Tyler Scott Williams</b></sub></a></td>
    <td align="center"><a href="https://devkucher.com/"><img src="https://avatars0.githubusercontent.com/u/11472929?v=4" width="100px;" alt=""/><br /><sub><b>Vania Kucher</b></sub></a></td>
    <td align="center"><a href="https://virenb.cc/"><img src="https://avatars1.githubusercontent.com/u/10731287?v=4" width="100px;" alt=""/><br /><sub><b>Viren Bhagat</b></sub></a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/Chuloo"><img src="https://avatars3.githubusercontent.com/u/22301208?v=4" width="100px;" alt=""/><br /><sub><b>William</b></sub></a></td>
    <td align="center"><a href="https://github.com/dcgoodwin2112"><img src="https://avatars1.githubusercontent.com/u/4554388?v=4" width="100px;" alt=""/><br /><sub><b>dcgoodwin2112</b></sub></a></td>
    <td align="center"><a href="https://github.com/bennettrogers"><img src="https://avatars1.githubusercontent.com/u/933251?v=4" width="100px;" alt=""/><br /><sub><b>Bennett Rogers</b></sub></a></td>
    <td align="center"><a href="https://github.com/byudaniel"><img src="https://avatars0.githubusercontent.com/u/7226285?v=4" width="100px;" alt=""/><br /><sub><b>Daniel O'Neill</b></sub></a></td>
    <td align="center"><a href="https://github.com/noobling"><img src="https://avatars2.githubusercontent.com/u/23206864?v=4" width="100px;" alt=""/><br /><sub><b>David Yu</b></sub></a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/adithyasunil26"><img src="https://avatars0.githubusercontent.com/u/51863389?v=4" width="100px;" alt=""/><br /><sub><b>Adithya Sunil</b></sub></a></td>
    <td align="center"><a href="https://edjiang.com/"><img src="https://avatars1.githubusercontent.com/u/918770?v=4" width="100px;" alt=""/><br /><sub><b>Edward Jiang</b></sub></a></td>
    <td align="center"><a href="http://manukall.de/"><img src="https://avatars0.githubusercontent.com/u/117418?v=4" width="100px;" alt=""/><br /><sub><b>Manuel Kallenbach</b></sub></a></td>
    <td align="center"><a href="https://github.com/NickSchmitt"><img src="https://avatars3.githubusercontent.com/u/23244885?v=4" width="100px;" alt=""/><br /><sub><b>Nick Schmitt</b></sub></a></td>
    <td align="center"><a href="https://monoglot.dev/"><img src="https://avatars0.githubusercontent.com/u/13792200?v=4" width="100px;" alt=""/><br /><sub><b>Jon Meyers</b></sub></a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/mbush92"><img src="https://avatars0.githubusercontent.com/u/15862774?v=4" width="100px;" alt=""/><br /><sub><b>Matthew Bush</b></sub></a></td>
    <td align="center"><a href="https://patrickgallagher.dev/"><img src="https://avatars.githubusercontent.com/u/35622595?v=4" width="100px;" alt=""/><br /><sub><b>Patrick Gallagher</b></sub></a></td>
    <td align="center"><a href="https://github.com/himankpathak"><img src="https://avatars.githubusercontent.com/u/26011845?v=4" width="100px;" alt=""/><br /><sub><b>Himank Pathak</b></sub></a></td>
    <td align="center"><a href="https://morganmspencer.com/"><img src="https://avatars.githubusercontent.com/u/10109983?v=4" width="100px;" alt=""/><br /><sub><b>Morgan Spencer</b></sub></a></td>
    <td align="center"><a href="http://www.ppinera.es/"><img src="https://avatars.githubusercontent.com/u/663605?v=4" width="100px;" alt=""/><br /><sub><b>Pedro Piñera Buendía</b></sub></a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/msutkowski"><img src="https://avatars.githubusercontent.com/u/784953?v=4" width="100px;" alt=""/><br /><sub><b>Matt Sutkowski</b></sub></a></td>
    <td align="center"><a href="http://www.simplethread.com/"><img src="https://avatars.githubusercontent.com/u/64120?v=4" width="100px;" alt=""/><br /><sub><b>Justin Etheredge</b></sub></a></td>
    <td align="center"><a href="https://zainf.dev/"><img src="https://avatars.githubusercontent.com/u/6315466?v=4" width="100px;" alt=""/><br /><sub><b>Zain Fathoni</b></sub></a></td>
    <td align="center"><a href="https://shrill-shrestha-portfolio.herokuapp.com/"><img src="https://avatars.githubusercontent.com/u/43284212?v=4" width="100px;" alt=""/><br /><sub><b>Shrill Shrestha</b></sub></a></td>
    <td align="center"><a href="https://www.brentjanderson.com/"><img src="https://avatars.githubusercontent.com/u/45031?v=4" width="100px;" alt=""/><br /><sub><b>Brent Anderson</b></sub></a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/VinayaSathyanarayana"><img src="https://avatars.githubusercontent.com/u/16976677?v=4" width="100px;" alt=""/><br /><sub><b>Vinaya Sathyanarayana</b></sub></a></td>
    <td align="center"><a href="https://www.willminshew.com/"><img src="https://avatars.githubusercontent.com/u/9845502?v=4" width="100px;" alt=""/><br /><sub><b>Will Minshew</b></sub></a></td>
    <td align="center"><a href="https://www.linkedin.com/in/tawfikyasser"><img src="https://avatars.githubusercontent.com/u/54971231?v=4" width="100px;" alt=""/><br /><sub><b>Tawfik Yasser</b></sub></a></td>
    <td align="center"><a href="https://sebastienlorber.com/"><img src="https://avatars.githubusercontent.com/u/749374?v=4" width="100px;" alt=""/><br /><sub><b>Sébastien Lorber</b></sub></a></td>
    <td align="center"><a href="https://github.com/o0charlie0o"><img src="https://avatars.githubusercontent.com/u/1259226?v=4" width="100px;" alt=""/><br /><sub><b>Charlie Ray</b></sub></a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/jangxyz"><img src="https://avatars.githubusercontent.com/u/52015?v=4" width="100px;" alt=""/><br /><sub><b>Kim, Jang-hwan</b></sub></a></td>
    <td align="center"><a href="https://wafuwafu13.hateblo.jp/"><img src="https://avatars.githubusercontent.com/u/50798936?v=4" width="100px;" alt=""/><br /><sub><b>TagawaHirotaka</b></sub></a></td>
    <td align="center"><a href="https://github.com/andrew-hwahin"><img src="https://avatars.githubusercontent.com/u/61768800?v=4" width="100px;" alt=""/><br /><sub><b>Andrew Lam</b></sub></a></td>
    <td align="center"><a href="https://github.com/bdurette"><img src="https://avatars.githubusercontent.com/u/403387?v=4" width="100px;" alt=""/><br /><sub><b>Brandon DuRette</b></sub></a></td>
    <td align="center"><a href="https://github.com/cjreimer"><img src="https://avatars.githubusercontent.com/u/51102303?v=4" width="100px;" alt=""/><br /><sub><b>Curtis Reimer</b></sub></a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://twitter.com/webstacker"><img src="https://avatars.githubusercontent.com/u/6331356?v=4" width="100px;" alt=""/><br /><sub><b>Kevin Brown</b></sub></a></td>
    <td align="center"><a href="https://github.com/adriatic"><img src="https://avatars.githubusercontent.com/u/2712405?v=4" width="100px;" alt=""/><br /><sub><b>Nikolaj Ivancic</b></sub></a></td>
    <td align="center"><a href="https://github.com/nunopato"><img src="https://avatars.githubusercontent.com/u/1523504?v=4" width="100px;" alt=""/><br /><sub><b>Nuno Pato</b></sub></a></td>
    <td align="center"><a href="https://github.com/renansoares"><img src="https://avatars.githubusercontent.com/u/1657840?v=4" width="100px;" alt=""/><br /><sub><b>Renan Andrade</b></sub></a></td>
    <td align="center"><a href="https://github.com/saideepesh000"><img src="https://avatars.githubusercontent.com/u/43727167?v=4" width="100px;" alt=""/><br /><sub><b>Sai Deepesh</b></sub></a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/bl-ue"><img src="https://avatars.githubusercontent.com/u/54780737?v=4" width="100px;" alt=""/><br /><sub><b>bl-ue</b></sub></a></td>
    <td align="center"><a href="https://www.figma.com/@realstandal"><img src="https://avatars.githubusercontent.com/u/25166787?v=4" width="100px;" alt=""/><br /><sub><b>Ryan Lockard</b></sub></a></td>
    <td align="center"><a href="https://github.com/svenhanssen"><img src="https://avatars.githubusercontent.com/u/445182?v=4" width="100px;" alt=""/><br /><sub><b>Sven Hanssen</b></sub></a></td>
    <td align="center"><a href="https://mudssrali.github.io/"><img src="https://avatars.githubusercontent.com/u/24487349?v=4" width="100px;" alt=""/><br /><sub><b>Mudassar Ali</b></sub></a></td>
    <td align="center"><a href="https://github.com/sangheestyle"><img src="https://avatars.githubusercontent.com/u/319490?v=4" width="100px;" alt=""/><br /><sub><b>SangHee Kim</b></sub></a></td>
  </tr>
  <tr>
    <td align="center"><a href="http://loonyb.in/"><img src="https://avatars.githubusercontent.com/u/78673?v=4" width="100px;" alt=""/><br /><sub><b>Subhash Chandra</b></sub></a></td>
    <td align="center"><a href="https://github.com/seonghyeonkimm"><img src="https://avatars.githubusercontent.com/u/13966404?v=4" width="100px;" alt=""/><br /><sub><b>KimSeonghyeon</b></sub></a></td>
    <td align="center"><a href="https://github.com/origami-z"><img src="https://avatars.githubusercontent.com/u/5257855?v=4" width="100px;" alt=""/><br /><sub><b>Zhihao Cui</b></sub></a></td>
    <td align="center"><a href="https://corbt.com/"><img src="https://avatars.githubusercontent.com/u/176426?v=4" width="100px;" alt=""/><br /><sub><b>Kyle Corbitt</b></sub></a></td>
    <td align="center"><a href="https://github.com/SEANDOUGHTY"><img src="https://avatars.githubusercontent.com/u/12256202?v=4" width="100px;" alt=""/><br /><sub><b>Sean Doughty</b></sub></a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/zakmandhro"><img src="https://avatars.githubusercontent.com/u/15746?v=4" width="100px;" alt=""/><br /><sub><b>Zak Mandhro</b></sub></a></td>
    <td align="center"><a href="https://bozdoz.com/"><img src="https://avatars.githubusercontent.com/u/1410985?v=4" width="100px;" alt=""/><br /><sub><b>bozdoz</b></sub></a></td>
    <td align="center"><a href="https://mountaintopcoding.dev/"><img src="https://avatars.githubusercontent.com/u/14932877?v=4" width="100px;" alt=""/><br /><sub><b>Isaac Tait</b></sub></a></td>
    <td align="center"><a href="https://jace.pro/"><img src="https://avatars.githubusercontent.com/u/638764?v=4" width="100px;" alt=""/><br /><sub><b>Jace</b></sub></a></td>
    <td align="center"><a href="https://github.com/bernsno"><img src="https://avatars.githubusercontent.com/u/13946?v=4" width="100px;" alt=""/><br /><sub><b>Noah Bernsohn</b></sub></a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/rene-demonsters"><img src="https://avatars.githubusercontent.com/u/20322259?v=4" width="100px;" alt=""/><br /><sub><b>rene-demonsters</b></sub></a></td>
    <td align="center"><a href="https://sharov.dev/"><img src="https://avatars.githubusercontent.com/u/1423028?v=4" width="100px;" alt=""/><br /><sub><b>Sergey Sharov</b></sub></a></td>
    <td align="center"><a href="https://twitter.com/blackpr"><img src="https://avatars.githubusercontent.com/u/30457?v=4" width="100px;" alt=""/><br /><sub><b>Tim Pap</b></sub></a></td>
    <td align="center"><a href="https://github.com/in-in"><img src="https://avatars.githubusercontent.com/u/8797432?v=4" width="100px;" alt=""/><br /><sub><b>in-in</b></sub></a></td>
    <td align="center"><a href="https://github.com/mlabate"><img src="https://avatars.githubusercontent.com/u/17139676?v=4" width="100px;" alt=""/><br /><sub><b>mlabate</b></sub></a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/pdjota"><img src="https://avatars.githubusercontent.com/u/93544?v=4" width="100px;" alt=""/><br /><sub><b>Pablo Dejuan</b></sub></a></td>
    <td align="center"><a href="https://github.com/bugsfunny"><img src="https://avatars.githubusercontent.com/u/12965842?v=4" width="100px;" alt=""/><br /><sub><b>bugsfunny</b></sub></a></td>
    <td align="center"><a href="https://github.com/luispinto23"><img src="https://avatars.githubusercontent.com/u/4148663?v=4" width="100px;" alt=""/><br /><sub><b>Luís Pinto</b></sub></a></td>
    <td align="center"><a href="https://www.leighhalliday.com/"><img src="https://avatars.githubusercontent.com/u/603921?v=4" width="100px;" alt=""/><br /><sub><b>Leigh Halliday</b></sub></a></td>
    <td align="center"><a href="https://github.com/BlackHawkSigma"><img src="https://avatars.githubusercontent.com/u/14921811?v=4" width="100px;" alt=""/><br /><sub><b>BlackHawkSigma</b></sub></a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://www.linkedin.com/in/devhmac/"><img src="https://avatars.githubusercontent.com/u/52307383?v=4" width="100px;" alt=""/><br /><sub><b>Devin MacGillivray</b></sub></a></td>
    <td align="center"><a href="https://github.com/pachoclo"><img src="https://avatars.githubusercontent.com/u/3608140?v=4" width="100px;" alt=""/><br /><sub><b>Francisco Jaramillo</b></sub></a></td>
    <td align="center"><a href="https://orta.io/"><img src="https://avatars.githubusercontent.com/u/49038?v=4" width="100px;" alt=""/><br /><sub><b>Orta Therox</b></sub></a></td>
    <td align="center"><a href="https://github.com/viperfx"><img src="https://avatars.githubusercontent.com/u/328257?v=4" width="100px;" alt=""/><br /><sub><b>Tharshan Muthulingam</b></sub></a></td>
    <td align="center"><a href="https://brianypliu.com/"><img src="https://avatars.githubusercontent.com/u/3888780?v=4" width="100px;" alt=""/><br /><sub><b>Brian Liu</b></sub></a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/ajoslin103"><img src="https://avatars.githubusercontent.com/u/443893?v=4" width="100px;" alt=""/><br /><sub><b>allen joslin</b></sub></a></td>
    <td align="center"><a href="https://github.com/wongyouth"><img src="https://avatars.githubusercontent.com/u/944583?v=4" width="100px;" alt=""/><br /><sub><b>Ryan Wang</b></sub></a></td>
    <td align="center"><a href="https://github.com/Vashiru"><img src="https://avatars.githubusercontent.com/u/11370057?v=4" width="100px;" alt=""/><br /><sub><b>Vashiru</b></sub></a></td>
    <td align="center"><a href="http://prolabprints.com/"><img src="https://avatars.githubusercontent.com/u/7111699?v=4" width="100px;" alt=""/><br /><sub><b>Ron Dyar</b></sub></a></td>
    <td align="center"><a href="https://github.com/toddpress"><img src="https://avatars.githubusercontent.com/u/2934422?v=4" width="100px;" alt=""/><br /><sub><b>Todd Pressley</b></sub></a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/zackdotcomputer"><img src="https://avatars.githubusercontent.com/u/643058?v=4" width="100px;" alt=""/><br /><sub><b>Zack Sheppard</b></sub></a></td>
    <td align="center"><a href="http://www.albertgao.xyz/"><img src="https://avatars.githubusercontent.com/u/18282328?v=4" width="100px;" alt=""/><br /><sub><b>AlbertGao</b></sub></a></td>
    <td align="center"><a href="https://github.com/vchoy"><img src="https://avatars.githubusercontent.com/u/1700776?v=4" width="100px;" alt=""/><br /><sub><b>vchoy</b></sub></a></td>
    <td align="center"><a href="https://github.com/alicelovescake"><img src="https://avatars.githubusercontent.com/u/66543449?v=4" width="100px;" alt=""/><br /><sub><b>Alice Zhao</b></sub></a></td>
    <td align="center"><a href="https://github.com/macovedj"><img src="https://avatars.githubusercontent.com/u/20097860?v=4" width="100px;" alt=""/><br /><sub><b>Daniel Macovei</b></sub></a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/igneel64"><img src="https://avatars.githubusercontent.com/u/15251081?v=4" width="100px;" alt=""/><br /><sub><b>Peter Perlepes</b></sub></a></td>
    <td align="center"><a href="https://github.com/benada002"><img src="https://avatars.githubusercontent.com/u/45796304?v=4" width="100px;" alt=""/><br /><sub><b>Benedict Adams</b></sub></a></td>
    <td align="center"><a href="https://hampuskraft.com/"><img src="https://avatars.githubusercontent.com/u/24176136?v=4" width="100px;" alt=""/><br /><sub><b>Hampus Kraft</b></sub></a></td>
    <td align="center"><a href="https://github.com/HarunKilic"><img src="https://avatars.githubusercontent.com/u/13366825?v=4" width="100px;" alt=""/><br /><sub><b>Harun Kilic</b></sub></a></td>
    <td align="center"><a href="https://www.mikenikles.com/"><img src="https://avatars.githubusercontent.com/u/788827?v=4" width="100px;" alt=""/><br /><sub><b>Mike Nikles</b></sub></a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/shahbaz17"><img src="https://avatars.githubusercontent.com/u/6962565?v=4" width="100px;" alt=""/><br /><sub><b>Mohammad Shahbaz Alam</b></sub></a></td>
    <td align="center"><a href="https://www.aggmoulik.me/"><img src="https://avatars.githubusercontent.com/u/22260031?v=4" width="100px;" alt=""/><br /><sub><b>Moulik Aggarwal</b></sub></a></td>
    <td align="center"><a href="https://github.com/doesnotexist"><img src="https://avatars.githubusercontent.com/u/304697?v=4" width="100px;" alt=""/><br /><sub><b>Omar El-Domeiri</b></sub></a></td>
    <td align="center"><a href="http://paulmckellar.com/"><img src="https://avatars.githubusercontent.com/u/8290?v=4" width="100px;" alt=""/><br /><sub><b>Paul McKellar</b></sub></a></td>
    <td align="center"><a href="https://github.com/sarthaktexas"><img src="https://avatars.githubusercontent.com/u/28282096?v=4" width="100px;" alt=""/><br /><sub><b>Sarthak Mohanty</b></sub></a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/justinjurenka"><img src="https://avatars.githubusercontent.com/u/19280122?v=4" width="100px;" alt=""/><br /><sub><b>Justin Jurenka</b></sub></a></td>
    <td align="center"><a href="https://github.com/redstab"><img src="https://avatars.githubusercontent.com/u/26380995?v=4" width="100px;" alt=""/><br /><sub><b>Jens Lindström</b></sub></a></td>
    <td align="center"><a href="https://pnfc.re/"><img src="https://avatars3.githubusercontent.com/u/24176136?v=4" width="100px;" alt=""/><br /><sub><b>Hampus Kraft</b></sub></a></td>
    <td align="center"><a href="http://ryanchenkie.com/"><img src="https://avatars.githubusercontent.com/u/1847678?v=4" width="100px;" alt=""/><br /><sub><b>Ryan Chenkie</b></sub></a></td>
    <td align="center"><a href="https://www.linkedin.com/profile/view?id=AAIAABLBfC4BE232yLpsGEF-dPR_QMXNvqrVucM&trk=nav_responsive_tab_profile_pic"><img src="https://avatars.githubusercontent.com/u/8780812?v=4" width="100px;" alt=""/><br /><sub><b>George Cameron</b></sub></a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/Dozacode"><img src="https://avatars.githubusercontent.com/u/35405844?v=4" width="100px;" alt=""/><br /><sub><b>John</b></sub></a></td>
    <td align="center"><a href="http://powerboard.co.nz/"><img src="https://avatars.githubusercontent.com/u/1866452?v=4" width="100px;" alt=""/><br /><sub><b>Shannon Smith</b></sub></a></td>
    <td align="center"><a href="https://github.com/0x1a4f7d58"><img src="https://avatars.githubusercontent.com/u/10007010?v=4" width="100px;" alt=""/><br /><sub><b>Bob</b></sub></a></td>
    <td align="center"><a href="https://github.com/facinick"><img src="https://avatars.githubusercontent.com/u/12322728?v=4" width="100px;" alt=""/><br /><sub><b>facinick</b></sub></a></td>
    <td align="center"><a href="https://github.com/virtuoushub"><img src="https://avatars.githubusercontent.com/u/4303638?v=4" width="100px;" alt=""/><br /><sub><b>Peter Colapietro</b></sub></a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://greener.bio/"><img src="https://avatars.githubusercontent.com/u/41754896?v=4" width="100px;" alt=""/><br /><sub><b>Teodoro Villaneuva</b></sub></a></td>
    <td align="center"><a href="https://github.com/SarveshLimaye"><img src="https://avatars.githubusercontent.com/u/74766567?v=4" width="100px;" alt=""/><br /><sub><b>Sarvesh Limaye</b></sub></a></td>
    <td align="center"><a href="https://github.com/7shantanu7"><img src="https://avatars.githubusercontent.com/u/51382138?v=4" width="100px;" alt=""/><br /><sub><b>Shantanu Zadbuke</b></sub></a></td>
    <td align="center"><a href="https://github.com/DukeManh"><img src="https://avatars.githubusercontent.com/u/51073515?v=4" width="100px;" alt=""/><br /><sub><b>Duke Manh</b></sub></a></td>
    <td align="center"><a href="https://github.com/memarino92"><img src="https://avatars.githubusercontent.com/u/62777339?v=4" width="100px;" alt=""/><br /><sub><b>Michael Marino</b></sub></a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/kibertoad"><img src="https://avatars.githubusercontent.com/u/1847934?v=4" width="100px;" alt=""/><br /><sub><b>Igor Savin</b></sub></a></td>
    <td align="center"><a href="https://jacobarriola.com/"><img src="https://avatars.githubusercontent.com/u/1371573?v=4" width="100px;" alt=""/><br /><sub><b>Jacob Arriola</b></sub></a></td>
    <td align="center"><a href="https://github.com/microsoft/Secure-Supply-Chain/"><img src="https://avatars.githubusercontent.com/u/90813519?v=4" width="100px;" alt=""/><br /><sub><b>Jingying Gu</b></sub></a></td>
    <td align="center"><a href="https://kolberger.eu/"><img src="https://avatars.githubusercontent.com/u/16899513?v=4" width="100px;" alt=""/><br /><sub><b>Tim Kolberger</b></sub></a></td>
    <td align="center"><a href="https://github.com/nzdjb"><img src="https://avatars.githubusercontent.com/u/825061?v=4" width="100px;" alt=""/><br /><sub><b>nzdjb</b></sub></a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/vivshaw"><img src="https://avatars.githubusercontent.com/u/23173985?v=4" width="100px;" alt=""/><br /><sub><b>Hannah Vivian Shaw</b></sub></a></td>
    <td align="center"><a href="https://github.com/usman-coe"><img src="https://avatars.githubusercontent.com/u/2543952?v=4" width="100px;" alt=""/><br /><sub><b>usman kareemee</b></sub></a></td>
    <td align="center"><a href="https://github.com/watway"><img src="https://avatars.githubusercontent.com/u/2321110?v=4" width="100px;" alt=""/><br /><sub><b>watway</b></sub></a></td>
    <td align="center"><a href="https://github.com/edapm"><img src="https://avatars.githubusercontent.com/u/67737851?v=4" width="100px;" alt=""/><br /><sub><b>Edward Mason</b></sub></a></td>
    <td align="center"><a href="https://tryhackme.com/p/zast99"><img src="https://avatars.githubusercontent.com/u/29718978?v=4" width="100px;" alt=""/><br /><sub><b>Mateo Carriquí</b></sub></a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/kataqatsi"><img src="https://avatars.githubusercontent.com/u/14959199?v=4" width="100px;" alt=""/><br /><sub><b>kataqatsi</b></sub></a></td>
    <td align="center"><a href="https://www.vaporware.net/"><img src="https://avatars.githubusercontent.com/u/2105665?v=4" width="100px;" alt=""/><br /><sub><b>Jeff Schroeder</b></sub></a></td>
    <td align="center"><a href="https://github.com/manunamz"><img src="https://avatars.githubusercontent.com/u/75578970?v=4" width="100px;" alt=""/><br /><sub><b>mnm</b></sub></a></td>
    <td align="center"><a href="https://github.com/BBurnworth"><img src="https://avatars.githubusercontent.com/u/5750537?v=4" width="100px;" alt=""/><br /><sub><b>BBurnworth</b></sub></a></td>
    <td align="center"><a href="https://refactorthis.dev/"><img src="https://avatars.githubusercontent.com/u/30505583?v=4" width="100px;" alt=""/><br /><sub><b>Jonathan</b></sub></a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://www.linkedin.com/in/rishabh-poddar-b64b73129/"><img src="https://avatars.githubusercontent.com/u/2976287?v=4" width="100px;" alt=""/><br /><sub><b>Rishabh Poddar</b></sub></a></td>
    <td align="center"><a href="https://vitaliimelnychuk.com/"><img src="https://avatars.githubusercontent.com/u/22550335?v=4" width="100px;" alt=""/><br /><sub><b>Vitalii Melnychuk</b></sub></a></td>
    <td align="center"><a href="https://github.com/bdefore"><img src="https://avatars.githubusercontent.com/u/142472?v=4" width="100px;" alt=""/><br /><sub><b>Buck DeFore</b></sub></a></td>
    <td align="center"><a href="https://github.com/kamarel"><img src="https://avatars.githubusercontent.com/u/84261846?v=4" width="100px;" alt=""/><br /><sub><b>Kamarel Malanda</b></sub></a></td>
    <td align="center"><a href="https://mvila.me/"><img src="https://avatars.githubusercontent.com/u/381671?v=4" width="100px;" alt=""/><br /><sub><b>Manuel Vila</b></sub></a></td>
  </tr>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

Redwood projects *(mostly)* follow the [all-contributions](https://allcontributors.org/) specification. Contributions of any kind are welcome.
