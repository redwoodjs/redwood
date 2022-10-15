# Upgrade Yarn

This codemod upgrades Redwood projects from yarn 1 to yarn 3.

The first thing it does is enable corepack:

```
corepack enable
```

Corepack is a new thing in the Node.js core—it essentially packages yarn with node so that it doesn't have to be installed separately.
Its only available on node >= `v14.9.0`, so we check for that first.

After enabling corepack, we set the yarn version:

```
yarn set version stable
```

Finally, before installing, we have to update `.yarnrc.yml` and `.gitignore`.
We have to update the `.yarnc.yml` because we only support the `node_modules` install strategy.
