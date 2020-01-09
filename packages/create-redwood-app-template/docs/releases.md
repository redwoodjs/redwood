# Releases

We use Lerna to release packages because it automatically figures out what's changed in our packages since the last release and keeps cross project dependencies in sync.

Run `yarn lerna changed` to see a list of packages that will be published, and run `yarn lerna publish` to bump the versions and release them to the public.

## Troubleshooting

If `yarn lerna publish` has failed use the `yarn lerna publish from-package` command to publish the packages that aren't already in the registry.

## Resources

- https://github.com/lerna/lerna#readme
- https://www.christopherbiscardi.com/post/multi-package-repos-with-lerna/#but-why