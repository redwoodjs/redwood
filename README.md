<p align="center">
  <img src="https://avatars2.githubusercontent.com/u/45050444?v=4" width="200" />
  <h1 align="center">Redwood</h1>
</p>

_by Tom Preston-Werner, Peter Pistorius, and Rob Cameron._

**Redwood is an opinionated, full-stack, serverless web application framework
that will allow you to build and deploy JAMstack applications with ease.**
Imagine a React frontend, statically delivered by CDN, that talks via GraphQL to
your backend running on AWS Lambdas around the world, all deployable with just a
`git push`—that's Redwood. By making a lot of decisions for you, Redwood lets
you get to work on what makes your application special, instead of wasting
cycles choosing and re-choosing various technologies and configurations. Plus,
because Redwood is a proper framework, you benefit from continued performance
and feature upgrades over time and with minimum effort.

> **WARNING:** Redwood is still in the **alpha** phase of development. We do not
> recommend that you use Redwood applications in production at this time. That said,
> your input can have a huge impact during this period, and we welcome your feedback
> and ideas! Check out the [Redwood Community
> Forum](https://community.redwoodjs.com/) to join in.

> **TUTORIAL:** The best way to get to know Redwood is by going through the extensive
> [Redwood Tutorial](https://redwoodjs.com/tutorial). Have fun!

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
- [GraphQL](https://graphql.org/) ([Apollo](https://github.com/apollographql))
- [Prisma](https://www.prisma.io/)
- [Jest](https://jestjs.io/) (coming soon)
- [Storybook](https://storybook.js.org/) (coming soon)
- [Babel](https://babeljs.io/)
- [Webpack](https://webpack.js.org/)

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
- First class JAMstack-style deployment to [Netlify](https://www.netlify.com/).

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
citizens. However, Redwood also shines with NoSQL databases.

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
<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-54-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="http://peterp.org/"><img src="https://avatars0.githubusercontent.com/u/44849?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Peter Pistorius</b></sub></a><br /><a href="https://github.com/redwoodjs/redwood/commits?author=peterp" title="Code">💻</a></td>
    <td align="center"><a href="http://thedavidprice.com/"><img src="https://avatars0.githubusercontent.com/u/2951?v=4?s=100" width="100px;" alt=""/><br /><sub><b>David Price</b></sub></a><br /><a href="https://github.com/redwoodjs/redwood/commits?author=thedavidprice" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/jtoar"><img src="https://avatars2.githubusercontent.com/u/32992335?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Dominic Saadi</b></sub></a><br /><a href="https://github.com/redwoodjs/redwood/commits?author=jtoar" title="Code">💻</a></td>
    <td align="center"><a href="http://tom.preston-werner.com/"><img src="https://avatars0.githubusercontent.com/u/1?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Tom Preston-Werner</b></sub></a><br /><a href="https://github.com/redwoodjs/redwood/commits?author=mojombo" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/RobertBroersma"><img src="https://avatars0.githubusercontent.com/u/4519828?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Robert</b></sub></a><br /><a href="https://github.com/redwoodjs/redwood/commits?author=RobertBroersma" title="Code">💻</a></td>
    <td align="center"><a href="http://ridingtheclutch.com/"><img src="https://avatars1.githubusercontent.com/u/300?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Rob Cameron</b></sub></a><br /><a href="https://github.com/redwoodjs/redwood/commits?author=cannikin" title="Code">💻</a></td>
    <td align="center"><a href="http://tlundberg.com/"><img src="https://avatars1.githubusercontent.com/u/30793?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Tobbe Lundberg</b></sub></a><br /><a href="https://github.com/redwoodjs/redwood/commits?author=Tobbe" title="Code">💻</a></td>
  </tr>
  <tr>
    <td align="center"><a href="http://antonmoiseev.com/"><img src="https://avatars0.githubusercontent.com/u/182853?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Anton Moiseev</b></sub></a><br /><a href="https://github.com/redwoodjs/redwood/commits?author=antonmoiseev" title="Code">💻</a></td>
    <td align="center"><a href="https://azimi.me/"><img src="https://avatars0.githubusercontent.com/u/543633?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Mohsen Azimi</b></sub></a><br /><a href="https://github.com/redwoodjs/redwood/commits?author=mohsen1" title="Code">💻</a></td>
    <td align="center"><a href="http://tapstudio.co.uk/"><img src="https://avatars1.githubusercontent.com/u/15834048?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Christopher Burns</b></sub></a><br /><a href="https://github.com/redwoodjs/redwood/commits?author=Burnsy" title="Code">💻</a></td>
    <td align="center"><a href="https://twitter.com/kimadeline_m"><img src="https://avatars3.githubusercontent.com/u/51720070?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Kim-Adeline Miguel</b></sub></a><br /><a href="https://github.com/redwoodjs/redwood/commits?author=kimadeline" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/dthyresson"><img src="https://avatars2.githubusercontent.com/u/1051633?v=4?s=100" width="100px;" alt=""/><br /><sub><b>David Thyresson</b></sub></a><br /><a href="https://github.com/redwoodjs/redwood/commits?author=dthyresson" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/aldonline"><img src="https://avatars2.githubusercontent.com/u/154884?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Aldo Bucchi</b></sub></a><br /><a href="https://github.com/redwoodjs/redwood/commits?author=aldonline" title="Code">💻</a></td>
    <td align="center"><a href="https://ghuser.io/jamesgeorge007"><img src="https://avatars2.githubusercontent.com/u/25279263?v=4?s=100" width="100px;" alt=""/><br /><sub><b>James George</b></sub></a><br /><a href="https://github.com/redwoodjs/redwood/commits?author=jamesgeorge007" title="Code">💻</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://brettjackson.org/"><img src="https://avatars0.githubusercontent.com/u/47246?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Brett Jackson</b></sub></a><br /><a href="https://github.com/redwoodjs/redwood/commits?author=bjackson" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/gfpacheco"><img src="https://avatars0.githubusercontent.com/u/3705660?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Guilherme Pacheco</b></sub></a><br /><a href="https://github.com/redwoodjs/redwood/commits?author=gfpacheco" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/noire-munich"><img src="https://avatars2.githubusercontent.com/u/10271407?v=4?s=100" width="100px;" alt=""/><br /><sub><b>noire.munich</b></sub></a><br /><a href="https://github.com/redwoodjs/redwood/commits?author=noire-munich" title="Code">💻</a></td>
    <td align="center"><a href="http://kasper.io/"><img src="https://avatars0.githubusercontent.com/u/230404?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Kasper Mikiewicz</b></sub></a><br /><a href="https://github.com/redwoodjs/redwood/commits?author=Idered" title="Code">💻</a></td>
    <td align="center"><a href="https://edamame.studio/"><img src="https://avatars0.githubusercontent.com/u/1521877?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Daniel Choudhury</b></sub></a><br /><a href="https://github.com/redwoodjs/redwood/commits?author=dac09" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/Jaikant"><img src="https://avatars2.githubusercontent.com/u/3472565?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Jai</b></sub></a><br /><a href="https://github.com/redwoodjs/redwood/commits?author=Jaikant" title="Code">💻</a></td>
    <td align="center"><a href="https://lachlanjc.com/"><img src="https://avatars1.githubusercontent.com/u/5074763?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Lachlan Campbell</b></sub></a><br /><a href="https://github.com/redwoodjs/redwood/commits?author=lachlanjc" title="Code">💻</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://satyarohith.com/"><img src="https://avatars2.githubusercontent.com/u/29819102?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Satya Rohith</b></sub></a><br /><a href="https://github.com/redwoodjs/redwood/commits?author=satyarohith" title="Code">💻</a></td>
    <td align="center"><a href="http://twitter.com/snormore"><img src="https://avatars1.githubusercontent.com/u/182290?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Steven Normore</b></sub></a><br /><a href="https://github.com/redwoodjs/redwood/commits?author=snormore" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/Rosenberg96"><img src="https://avatars2.githubusercontent.com/u/22986012?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Mads Rosenberg</b></sub></a><br /><a href="https://github.com/redwoodjs/redwood/commits?author=Rosenberg96" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/tedstoychev"><img src="https://avatars1.githubusercontent.com/u/1466111?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Ted Stoychev</b></sub></a><br /><a href="https://github.com/redwoodjs/redwood/commits?author=tedstoychev" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/eurobob"><img src="https://avatars1.githubusercontent.com/u/4255350?v=4?s=100" width="100px;" alt=""/><br /><sub><b>eurobob</b></sub></a><br /><a href="https://github.com/redwoodjs/redwood/commits?author=eurobob" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/vikash-eatgeek"><img src="https://avatars2.githubusercontent.com/u/50338945?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Vikash</b></sub></a><br /><a href="https://github.com/redwoodjs/redwood/commits?author=vikash-eatgeek" title="Code">💻</a></td>
    <td align="center"><a href="http://adrianmato.com/"><img src="https://avatars0.githubusercontent.com/u/589285?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Adrian Mato</b></sub></a><br /><a href="https://github.com/redwoodjs/redwood/commits?author=adrianmg" title="Code">💻</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/ackinc"><img src="https://avatars2.githubusercontent.com/u/4007598?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Anirudh Nimmagadda</b></sub></a><br /><a href="https://github.com/redwoodjs/redwood/commits?author=ackinc" title="Code">💻</a></td>
    <td align="center"><a href="http://www.benmccann.com/"><img src="https://avatars3.githubusercontent.com/u/322311?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Ben McCann</b></sub></a><br /><a href="https://github.com/redwoodjs/redwood/commits?author=benmccann" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/cball"><img src="https://avatars1.githubusercontent.com/u/14339?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Chris Ball</b></sub></a><br /><a href="https://github.com/redwoodjs/redwood/commits?author=cball" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/suvash"><img src="https://avatars3.githubusercontent.com/u/144952?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Suvash Thapaliya</b></sub></a><br /><a href="https://github.com/redwoodjs/redwood/commits?author=suvash" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/Thieffen"><img src="https://avatars1.githubusercontent.com/u/847877?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Thieffen Delabaere</b></sub></a><br /><a href="https://github.com/redwoodjs/redwood/commits?author=Thieffen" title="Code">💻</a></td>
    <td align="center"><a href="https://twitter.com/swyx"><img src="https://avatars1.githubusercontent.com/u/6764957?v=4?s=100" width="100px;" alt=""/><br /><sub><b>swyx</b></sub></a><br /><a href="https://github.com/redwoodjs/redwood/commits?author=sw-yx" title="Code">💻</a></td>
    <td align="center"><a href="https://maxleon.net/"><img src="https://avatars1.githubusercontent.com/u/745236?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Max Leon</b></sub></a><br /><a href="https://github.com/redwoodjs/redwood/commits?author=m-leon" title="Code">💻</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/maximgeerinck"><img src="https://avatars1.githubusercontent.com/u/615509?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Maxim Geerinck</b></sub></a><br /><a href="https://github.com/redwoodjs/redwood/commits?author=maximgeerinck" title="Code">💻</a></td>
    <td align="center"><a href="https://twitter.com/nexneo"><img src="https://avatars2.githubusercontent.com/u/794?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Niket Patel</b></sub></a><br /><a href="https://github.com/redwoodjs/redwood/commits?author=nexneo" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/0xflotus"><img src="https://avatars3.githubusercontent.com/u/26602940?v=4?s=100" width="100px;" alt=""/><br /><sub><b>0xflotus</b></sub></a><br /><a href="https://github.com/redwoodjs/redwood/commits?author=0xflotus" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/cephalization"><img src="https://avatars1.githubusercontent.com/u/8948924?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Anthony Powell</b></sub></a><br /><a href="https://github.com/redwoodjs/redwood/commits?author=cephalization" title="Code">💻</a></td>
    <td align="center"><a href="https://thewebdevcoach.com/"><img src="https://avatars3.githubusercontent.com/u/8263430?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Aryan J</b></sub></a><br /><a href="https://github.com/redwoodjs/redwood/commits?author=AryanJ-NYC" title="Code">💻</a></td>
    <td align="center"><a href="http://www.brianketelsen.com/"><img src="https://avatars1.githubusercontent.com/u/37492?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Brian Ketelsen</b></sub></a><br /><a href="https://github.com/redwoodjs/redwood/commits?author=bketelsen" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/dominicchapman"><img src="https://avatars2.githubusercontent.com/u/7607007?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Dominic Chapman</b></sub></a><br /><a href="https://github.com/redwoodjs/redwood/commits?author=dominicchapman" title="Code">💻</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/evanmoncuso"><img src="https://avatars3.githubusercontent.com/u/12928071?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Evan Moncuso</b></sub></a><br /><a href="https://github.com/redwoodjs/redwood/commits?author=evanmoncuso" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/petukhov"><img src="https://avatars1.githubusercontent.com/u/2112710?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Georgy Petukhov</b></sub></a><br /><a href="https://github.com/redwoodjs/redwood/commits?author=petukhov" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/leibowitz"><img src="https://avatars0.githubusercontent.com/u/1508563?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Gianni Moschini</b></sub></a><br /><a href="https://github.com/redwoodjs/redwood/commits?author=leibowitz" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/gielcobben"><img src="https://avatars0.githubusercontent.com/u/2663212?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Giel</b></sub></a><br /><a href="https://github.com/redwoodjs/redwood/commits?author=gielcobben" title="Code">💻</a></td>
    <td align="center"><a href="https://pnfc.re/"><img src="https://avatars3.githubusercontent.com/u/24176136?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Hampus Kraft</b></sub></a><br /><a href="https://github.com/redwoodjs/redwood/commits?author=pnfcre" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/janimo"><img src="https://avatars2.githubusercontent.com/u/50138?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Jani Monoses</b></sub></a><br /><a href="https://github.com/redwoodjs/redwood/commits?author=janimo" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/redstab"><img src="https://avatars0.githubusercontent.com/u/26380995?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Jens Lindström</b></sub></a><br /><a href="https://github.com/redwoodjs/redwood/commits?author=redstab" title="Code">💻</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/jeliasson"><img src="https://avatars2.githubusercontent.com/u/865493?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Johan Eliasson</b></sub></a><br /><a href="https://github.com/redwoodjs/redwood/commits?author=jeliasson" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/leonardoelias"><img src="https://avatars2.githubusercontent.com/u/1995213?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Leonardo Elias</b></sub></a><br /><a href="https://github.com/redwoodjs/redwood/commits?author=leonardoelias" title="Code">💻</a></td>
    <td align="center"><a href="https://loganhoup.com/"><img src="https://avatars0.githubusercontent.com/u/17230438?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Logan Houp</b></sub></a><br /><a href="https://github.com/redwoodjs/redwood/commits?author=hu0p" title="Code">💻</a></td>
    <td align="center"><a href="http://lorensr.me/"><img src="https://avatars2.githubusercontent.com/u/251288?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Loren ☺️</b></sub></a><br /><a href="https://github.com/redwoodjs/redwood/commits?author=lorensr" title="Code">💻</a></td>
    <td align="center"><a href="https://markpollmann.com/"><img src="https://avatars2.githubusercontent.com/u/5286559?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Mark Pollmann</b></sub></a><br /><a href="https://github.com/redwoodjs/redwood/commits?author=MarkPollmann" title="Code">💻</a></td>
  </tr>
</table>

<!-- markdownlint-enable -->
<!-- prettier-ignore-end -->
<!-- ALL-CONTRIBUTORS-LIST:END -->