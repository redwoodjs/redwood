# Nested `node_modules`

When packages request different versions of the same dependency, Yarn tries to
make both packages happy by installing two copies of that dependency. With a
little bit of hand-waving here, for the `node-modules` linker, since dependencies
have to exist at a single place on disk, Yarn has to decide which one gets
hoisted to the top level (i.e. `node_modules/dependency`) and which one has to
be nested
(`node_modules/package-requesting-different-version/node_modules/dependency`).
As far as I can tell, it does this in a more or less sensible way by hoisting
the version that's requested the most.

But when our own `@redwoodjs` packages become nested, it's usually a (painful)
problem for us and for our users. This script identifies which of CRWA's
dependencies have a lot of nested dependencies:

```bash
yarn node ./tasks/nmHoisting/nmHoisting.mjs
```

Here's a snippet of the nested dependencies for the `@redwoodjs` packages as of
version `v6.5.1`:

```json5
{
  hoistedNodeModules: {
    // ...
    '@redwoodjs/internal': {
      'source-map': '0.7.4',
    },
    '@redwoodjs/cli': {
      decamelize: '5.0.1',
    },
    '@redwoodjs/testing': {
      '@types/node': '18.18.9',
    },
    '@redwoodjs/api': {
      '@whatwg-node/fetch': '0.9.14',
    },
    '@redwoodjs/telemetry': {
      '@whatwg-node/fetch': '0.9.14',
    },
    '@redwoodjs/prerender': {
      '@whatwg-node/fetch': '0.9.14',
    },
    '@redwoodjs/structure': {
      'lru-cache': '7.18.3',
    },
    '@redwoodjs/graphql-server': {
      '@graphql-tools/utils': '10.0.11',
      '@graphql-tools/utils/cjs': 'null',
      '@graphql-tools/schema': '10.0.2',
      '@graphql-tools/schema/cjs': 'null',
    },
    // ...
  },
}
```

You can also see a visualization by opening [nmHoistingVisualize.html](./nmHoistingVisualize.html):
