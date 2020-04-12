# Releases

To publish a new version of Redwood to NPM run the following commands:

```bash
yarn lerna version --force-publish
yarn lerna publish from-package
```

The changes the version of **all the packages** (even those that haven't changed) and publishes it to NPM.

## Troubleshooting

If something went wrong you can use `yarn lerna publish from-package` to publish the packages that aren't already in the registry.
