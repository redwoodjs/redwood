# Releases

We use Lerna to release packages because it figures out what has changed in our packages since the last release and keeps cross project dependencies in sync.

  yarn lerna version --force-publish
  yarn lerna publish from-package

Will change the versions of **all the packages**, even if they haven't been updated, and publish them to npm.

## Troubleshooting

If `yarn lerna publish` has failed use the `yarn lerna publish from-package` command to publish the packages that aren't already in the registry.

## Resources

- https://github.com/lerna/lerna#readme
- https://www.christopherbiscardi.com/post/multi-package-repos-with-lerna/#but-why