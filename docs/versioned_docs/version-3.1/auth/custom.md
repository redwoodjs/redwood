---
sidebar_label: Custom
---

# Custom Authentication Client

## Installation

The following CLI command (not implemented, see https://github.com/redwoodjs/redwood/issues/1585) will install required packages and generate boilerplate code and files for Redwood Projects:

```bash
yarn rw setup auth custom
```

## Setup

It is possible to implement a custom provider for Redwood Auth. In which case you might also consider adding the provider to Redwood itself.

If you are trying to implement your own auth, support is very early and limited at this time. Additionally, there are many considerations and responsibilities when it comes to managing custom auth. For most cases we recommend using an existing provider.

However, there are examples contributed by developers in the Redwood forums and Discord server.

The most complete example (although now a bit outdated) is found in [this forum thread](https://community.redwoodjs.com/t/custom-github-jwt-auth-with-redwood-auth/610). Here's another [helpful message in the thread](https://community.redwoodjs.com/t/custom-github-jwt-auth-with-redwood-auth/610/25).
