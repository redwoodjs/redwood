# Releases

We use Lerna to release packages because it figures out what's changed in our packages since the last release.

Run `yarn lerna changed` to see a list of packages that will be published, and run `yarn lerna publish` to bump the versions and release them to the public.

## Troubleshooting

When a previous `yarn lerna publish` failed you can use the `from-package` flag to
publish the packages that aren't in the registry.

## Resources

- https://lerna.js.org/
- https://www.christopherbiscardi.com/post/multi-package-repos-with-lerna/#but-why