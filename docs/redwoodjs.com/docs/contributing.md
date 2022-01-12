# Contributing

Love Redwood and want to get involved? You’re in the right place and in good company! As of this writing, there are more than [170 contributors](https://github.com/redwoodjs/redwood/blob/main/README.md#contributors) who have helped make Redwood awesome by contributing code and documentation. This doesn't include all those who participate in the vibrant, helpful, and encouraging Forums and Discord, which are both great places to get started if you have any questions.

There are several ways you can contribute to Redwood:

- join the [community Forums](https://community.redwoodjs.com/) and [Discord server](https://discord.gg/jjSYEQd)
- triage [issues on the repo](https://github.com/redwoodjs/redwood/issues)
- write and edit [docs](#contributing-docs)
- and of course, write code!

> Before interacting with the Redwood community, please read and understand our [Code of Conduct](https://github.com/redwoodjs/redwood/blob/main/CODE_OF_CONDUCT.md#contributor-covenant-code-of-conduct).

## Contributing Code

Redwood's composed of many packages that are designed to work together. Some of these packages are designed to be used outside Redwood too!

Before you start contributing, you'll want to set up your local development environment. The Redwood repo's top-level [contributing guide](https://github.com/redwoodjs/redwood/blob/main/CONTRIBUTING.md#local-development) walks you through this. Make sure to give it an initial read.

For details on contributing to a specific package, see the package's README (links provided in the table below). Each README has a section named Roadmap. If you want to get involved but don't quite know how, the Roadmap's a good place to start. See anything that interests you? Go for it! And be sure to let us know&mdash;you don't have to have a finished product before opening an issue or pull request. In fact, we're big fans of [Readme Driven Development](https://tom.preston-werner.com/2010/08/23/readme-driven-development.html).

What you want to do not on the roadmap? Well, still go for it! We love spikes and proof-of-concepts. And if you have a question, just ask!

|Package|Description|
|:-|:-|
|[`@redwoodjs/api-server`](https://github.com/redwoodjs/redwood/blob/main/packages/api-server/README.md)|Run a Redwood app using Express server (alternative to serverless API)|
|[`@redwoodjs/api`](https://github.com/redwoodjs/redwood/blob/main/packages/api/README.md)|Infrastruction components for your applications UI including logging, webhooks, authentication decoders and parsers, as well as tools to test custom serverless functions and webhooks|
|[`@redwoodjs/auth`](https://github.com/redwoodjs/redwood/blob/main/packages/auth/README.md#contributing)|A lightweight wrapper around popular SPA authentication libraries|
|[`@redwoodjs/cli`](https://github.com/redwoodjs/redwood/blob/main/packages/cli/README.md)|All the commands for Redwood's built-in CLI|
|[`@redwoodjs/core`](https://github.com/redwoodjs/redwood/blob/main/packages/core/README.md)|Defines babel plugins and config files|
|[`@redwoodjs/create-redwood-app`](https://github.com/redwoodjs/redwood/blob/main/packages/create-redwood-app/README.md)|Enables `yarn create redwood-app`&mdash;downloads the latest release of Redwood and extracts it into the supplied directory|
|[`@redwoodjs/dev-server`](https://github.com/redwoodjs/redwood/blob/main/packages/dev-server/README.md)|Configuration for the local development server|
|[`@redwoodjs/eslint-config`](https://github.com/redwoodjs/redwood/blob/main/packages/eslint-config/README.md)|Defines Redwood's eslint config|
|[`@redwoodjs/eslint-plugin-redwood`](https://github.com/redwoodjs/redwood/blob/main/packages/eslint-plugin-redwood/README.md)|Defines eslint plugins; currently just prohibits the use of non-existent pages in `Routes.js`|
|[`@redwoodjs/forms`](https://github.com/redwoodjs/redwood/blob/main/packages/forms/README.md)|Provides Form helpers|
|[`@redwoodjs/graphql-server`](https://github.com/redwoodjs/redwood/blob/main/packages/graphql-server/README.md)|Exposes functions to build the GraphQL API, provides services with `context`, and a set of envelop plugins to supercharge your GraphQL API with logging, authentication, error handling, directives and more|
|[`@redwoodjs/internal`](https://github.com/redwoodjs/redwood/blob/main/packages/internal/README.md)|Provides tooling to parse Redwood configs and get a project's paths|
|[`@redwoodjs/router`](https://github.com/redwoodjs/redwood/blob/main/packages/router/README.md)|The built-in router for Redwood|
|[`@redwoodjs/structure`](https://github.com/redwoodjs/redwood/blob/main/packages/structure/README.md)|Provides a way to build, validate and inspect an object graph that represents a complete Redwood project|
|[`@redwoodjs/testing`](https://github.com/redwoodjs/redwood/blob/main/packages/testing/README.md)|Provides helpful defaults when testing a Redwood project's web side|
|[`@redwoodjs/web`](https://github.com/redwoodjs/redwood/blob/main/packages/web/README.md)|Configures a Redwood's app web side: wraps the Apollo Client in `RedwoodApolloProvider`; defines the Cell HOC|

## Contributing Docs

First off, thank you for your interest in contributing docs! Redwood prides itself on good developer experience, and that includes good documentation.

Before you get started, there's an implicit doc-distinction that we should make explicit: all the docs on redwoodjs.com are for helping people develop apps using Redwood, while all the docs on the Redwood repo are for helping people contribute to Redwood.

Although Developing and Contributing docs are in different places, they most definitely should be linked and referenced as needed. For example, it's appropriate to have a "Contributing" doc on redwoodjs.com that's context-appropriate, but it should link to the Framework's [CONTRIBUTING.md](https://github.com/redwoodjs/redwood/blob/main/CONTRIBUTING.md) (the way this doc does).

### How Redwood Thinks about Docs

Before we get into the how-to, a little explanation. When thinking about docs, we find [divio's documentation system](https://documentation.divio.com/) really useful. It's not necessary that a doc always have all four of the dimensions listed, but if you find yourself stuck, you can ask yourself questions like "Should I be explaining? Am I explaining too much? Too little?" to reorient yourself while writing.

### Docs for Developing Redwood Apps

redwoodjs.com has three kinds of Developing docs: Docs, Cookbook Recipes, and The Tutorial.
You can find Docs and Cookbook Recipes within their respective directories on the redwood/redwoodjs.com repo: [docs/](https://github.com/redwoodjs/redwoodjs.com/tree/main/docs) and [cookbook/](https://github.com/redwoodjs/redwoodjs.com/tree/main/cookbook). The Tutorial is actually all in [one file](https://github.com/redwoodjs/redwoodjs.com/blob/main/TUTORIAL.md).

The Tutorial is a standalone document that serves a specific purpose as an introduction to Redwood, an aspirational roadmap, and an example of developer experience. As such, it's distinct from the categories mentioned, although it's most similar to Cookbook Recipes.

#### Docs

Docs are explanation-driven how-to content. They're more direct and to-the-point than The Tutorial and Cookbook Recipes. The idea is much more about finding something or getting something done than any kind of learning journey.

Before you take on a doc, you should read [Form](https://redwoodjs.com/docs/form) and [Redwood Router](https://redwoodjs.com/docs/redwood-router); they have the kind of content you should be striving for. They're comprehensive yet conversational.

In general, don't be afraid to go into too much detail. We'd rather you err on the side of too much than too little. One tip for finding good content is searching the forum and repo for "prior art"&mdash;what are people talking about where this comes up?

#### Cookbook Recipes

Cookbook Recipes are tutorial-style content focused on a specific problem-solution. They usually have a beginner in mind (if not, they should indicate that they don't&mdash;put 'Advanced' or 'Deep-Dive', etc., in the title or introduction). Cookbook Recipes may include some explanatory text as asides, but they shouldn't be the majority of the content.

#### Making a Doc Findable

If you write it, will they read it? We think they will&mdash;if they can find it.

After you've finished writing, step back for a moment and consider the word(s) or phrase(s) people will use to find what you just wrote. For example, let's say you were writing a doc about configuring a Redwood app. If you didn't know much about configuring a Redwood app, a heading (in the nav bar to the left) like "redwood.toml" wouldn't make much sense, even though it _is_ the main configuration file. You'd probably look for "Redwood Config" or "Settings", or type "how to change Redwood App settings" in the "Search the docs" bar up top, or in Google.

That is to say, the most useful headings aren't always the most literal ones. Indexing is more than just underlining the "important" words in a text&mdash;it's identifying and locating the concepts and topics that are the most relevant to our readers, the users of our documentation.

So, after you've finished writing, reread what you wrote with the intention of making a list of two to three keywords or phrases. Then, try to use each of those in three places, in this order of priority:

- the left-nav menu title
- the page title or the first right-nav ("On this page") section title
- the introductory paragraph

### Docs for Contributing to the Redwood Repo

These docs are in the Framework repo, redwoodjs/redwood, and explain how to contribute to Redwood packages. They're the docs linked to in the table above.

In general, they should consist of more straightforward explanations, are allowed to be technically heavy, and should be written for a more experienced audience. But as a best practice for collaborative projects, they should still provide a Vision + Roadmap and identify the project-point person(s) (or lead(s)).
