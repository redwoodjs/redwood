---
sidebar_label: Custom
---

# Custom Authentication Client

## Installation

The following CLI command will install required packages and generate
boilerplate code and files for Redwood Projects:

```bash
yarn rw setup auth custom
```

## Setup

It is possible to implement a custom provider for Redwood Auth. If you end up
building something you're proud of, please consider sharing with the community!

There are many considerations and responsibilities when it comes to managing
custom auth. For most cases we recommend using an existing provider. However,
there are examples contributed by developers in the Redwood forums and Discord
server.

The most complete example (although now a bit outdated) is found in [this forum
thread](https://community.redwoodjs.com/t/custom-github-jwt-auth-with-redwood-auth/610).
Here's another [helpful message in the
thread](https://community.redwoodjs.com/t/custom-github-jwt-auth-with-redwood-auth/610/25).
Both were built with a previous version of the Redwood auth subsystem.

The easiest way to get started writing your own custom auth provider is
probably to look at one of the existing implementations. The simplest might
be GoTrue or Netlify (they're basically the same). The most advanced example
is by far dbAuth.
