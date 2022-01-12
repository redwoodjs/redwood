# Roadmap

_Last updated 29 September 2021_

RedwoodJS is very close to a stable version 1.0. In the last two years, the project has matured significantly and is already used in production by a number of startups. We intend to have a 1.0 release candidate before the end of 2021 and to release a truly production-ready 1.0 in early 2022. If you want to follow along with development, we are updating the ["Current Release Sprint"](https://github.com/redwoodjs/redwood/projects) GitHub project board several times a week. Once the "On Deck" and "In Progress" columns are complete, we'll be publishing the `v1.0.0-rc`.

At this stage of development, when it's so important to keep the finish line in mind, a high-level overview is invaluable. Hence, this roadmap, and these color-coded labels:

- <span id="status-0" class="font-mono">Didn't start</span>
- <span id="status-1" class="font-mono">Figuring it out</span>
- <span id="status-2" class="font-mono">There's a plan</span>
- <span id="status-3" class="font-mono">Making it happen</span>
- <span id="status-4" class="font-mono">Polishing</span>

Not everything will be in `v1.0`. Even things core to the Redwood dream—like more sides and targets—won't be there. But that's by design: we're trying to be careful about our priorities, both because we want `v1.0` to be something special and because if we aren't careful, we'll never get there. 
One of the hardest things in open source is saying no, but as we get closer to `v1.0`, it's increasingly what we'll have to do.

With that said, here's the `v1.0` roadmap. If you're interested in contributing to one of these categories, just let us know in the [RedwoodJS Forum](https://community.redwoodjs.com/) and we'll be happy to get you set up. With so many corners to finish, we need contributors now more than ever, so even the smallest contribution is appreciated!

## Accessibility

<span id="status-4" class="font-mono">Polishing</span>

Accessibility is a first-class concern. We want you to be able to build accessible websites without having to jump through hoops. While accessibility is a broad topic that we plan to keep iterating on, `v1.0` will bring you a solid foundation, addressing key concerns, like route announcements and scroll. And the best part is: it's all baked-in.

A common theme leading up to `v1.0` will be that we want to make sure what we have actually works, so if you're savvy with a screen reader, testing the route announcer on multiple screen readers on multiple browsers would be invaluable feedback! 

[GitHub Project Board](https://github.com/redwoodjs/redwood/projects/20)

## Auth

<span id="status-4" class="font-mono">Polishing</span>

Authentication and authorization are questions Redwood has had answers to since `v0.7`. Redwood has easy-to-install, sophisticated auth for a variety of providers. There's even role-based access controls (RBACs)! Authentication and authorization are integrated across the whole stack, and when `v1.0` rolls around, your Services will be secure by default. For more, see [Security](https://redwoodjs.com/docs/security).

[GitHub Project Board](https://github.com/redwoodjs/redwood/projects/20)

## Core

<span id="status-3" class="font-mono">Making it happen</span>

Redwood depends on a few libraries&mdash;namely Prisma&mdash;for some of its core functionality. For us to be `v1.0`, they have to be too. With Prisma recently carrying Migrate and Studio to general availability (GA) to complete the ORM, it's safe to say that they're ready to go. As we transition to Envelop and polish Cells, GraphQL is one of the other core aspects of Redwood that's getting a lot of attention.

[GitHub Project Board](https://github.com/redwoodjs/redwood/projects/20)

## Deployment

<span id="status-4" class="font-mono">Polishing</span>

We want to be able to deploy everywhere and anywhere: serverless, serverful, to the edge—to the world! Much like auth, we've already got a great lineup: Netlify (done), Vercel (done), Render (done), AWS (done), and Google Cloud Run (in the works). We'll always be looking to add more and to support custom deployment strategies.

[GitHub Project Board](https://github.com/redwoodjs/redwood/projects/20)

## Docs

<span id="status-3" class="font-mono">Making it happen</span>

A major part of Redwood's initial success was it's tutorial. The practice of readable, enjoyable, and comprehensive documentation is something we plan to continue. Getting to `v1.0` doesn't mean sacrificing the quality of docs; on the contrary, the more the framework can do, the better the docs have to be.

We welcome any and all contributions, from fixing typos to adding cookbooks! 

One thing we plan on doing before `v1.0` is moving over to Docusarus to accommodate features like versioning. When we release `v1.0`, we'll lock the docs in and version from there. The tutorials are over there already, with translations to boot! 

## Generators

<span id="status-4" class="font-mono">Polishing</span>

Generators are part of what makes Redwood a joy. We've made generators more configurable, so you can do things like opt in and out of generating stories and test files, and generate files in TypeScript rather than JavaScript. Look out for another long awaited configuration option: the ability to specify the path—where things get generated.

[GitHub Project Board](https://github.com/redwoodjs/redwood/projects/20)

## Logging

<span id="status-4" class="font-mono">Polishing</span>

Logging has wiped out almost all of the old-growth Redwoods in California. But that doesn't mean we're not fans of logging here at RedwoodJS. As long as the logging helps you figure out what your app is doing! A production Redwood app will need great logging, so we intend to make it easy to get hooked up.

[GitHub Project Board](https://github.com/redwoodjs/redwood/projects/20)

## Performance

<span id="status-2" class="font-mono">There's a plan</span>

Can you have great developer ergonomics **and** performance? We intend to find out.

Bundle size will be important here, so a good place to start is by building with the stats flag (`yarn rw build --stats`). This will make Redwood bundle with the [Webpack Bundle Analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer).

[GitHub Project Board](https://github.com/redwoodjs/redwood/projects/20)

## Prerender

<span id="status-4" class="font-mono">Polishing</span>

Along with TypeScript, Prerendering was one of our most-requested features. It's been available for some time now; all you have to do is add a single prop to one of your Routes:

```jsx
<Route path="/" page={HomePage} name="home" prerender />
```

<br />

We're not done by any means; there's a lot more features we'll add to Prerendering post `v1.0`, but for now we're making sure it works and it works well, and that includes any page flashes.

## Router

<span id="status-4" class="font-mono">Polishing</span>

We've written our own router for Redwood, and we need to make sure it's competitive with existing routers in the React ecosystem (e.g. React Router, Reach Router). We've taken a stance on desiring a flat routing scheme (vs a nested one) and this currently comes with some performance downsides, some of which we've addressed with Sets. There's a lot of little things for us to polish, so if you're looking to work on something with a smaller scope, the router's a great place to get started.

[GitHub Project Board](https://github.com/redwoodjs/redwood/projects/20)

## Storybook

<span id="status-4" class="font-mono">Polishing</span>

Redwood's component-development workflow starts with Storybook. Being able to develop your components in isolation without ever starting the dev server is a real game-changer. Redwood even generates mock data for your Cells so you can iterate on all of your component states!

[GitHub Project Board](https://github.com/redwoodjs/redwood/projects/20)

## Structure

<span id="status-3" class="font-mono">Making it happen</span>

Using Redwood's Structure package, we can use the same logic to power both an IDE (i.e. Jamstack IDE) and Redwood itself. Redwood Structure's most common use-case is getting the diagnostics of a complete Redwood project, but being able to programmatically talk about a Redwood project like an AST moves many other amazing things we can't anticipate into the adjacent possible.

[GitHub Project Board](https://github.com/redwoodjs/redwood/projects/20)

## Testing (App)

<span id="status-4" class="font-mono">Polishing</span>

Redwood makes testing a first-class concern, and maybe even makes it fun? We've integrated testing for both sides, and even wrote a [tome](https://redwoodjs.com/docs/testing) telling you how to use it, from the ground-up. We've got a template for Functions in the works, which would all but bring our unit tests to a close. One thing we'd really like to add as a stretch goal is a GitHub Action so you can have CI from the get go!

[GitHub Project Board](https://github.com/redwoodjs/redwood/projects/20)

## TypeScript

<span id="status-3" class="font-mono">Making it happen</span>

The [TypeScript tracking issue](https://github.com/redwoodjs/redwood/issues/234) easily has the most reactions of any of our issues and PRs. Bit by bit we've made Redwood more and more TypeScript compliant. [@corbt](https://github.com/corbt) (Kyle Corbitt) even [graphed our progress](https://github.com/redwoodjs/redwood/issues/234#issuecomment-792390125)! 

[Cells](https://github.com/redwoodjs/redwood/pull/2208) were one of the more-recent additions. And some of the things we've got coming, like [GraphQL Codegen](https://github.com/redwoodjs/redwood/pull/2485), are going to be icing on the cake.

Although we want Redwood apps to default to TypeScript, you can still just stick to JS! It's totally up to you. All of our utilities, like generators, support both.

[GitHub Project Board](https://github.com/redwoodjs/redwood/projects/20)
