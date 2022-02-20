# CHANGELOG

## Upcoming 1.0.0 Deprecations
The following items are scheduled for 1.0.0 deprecation:
- api-server binary `rw-api-server`; use `rw-server api` instead (See [api-server/src/index.ts](https://github.com/redwoodjs/redwood/blob/main/packages/api-server/src/index.ts))

## Current and Previous Versions
For all changelog information since v0.0.1:
- [GitHub Releases](https://github.com/redwoodjs/redwood/releases)

## [0.0.1-alpha.15] - 2020-01-04

### Changed

- Renamed `hammerframework` to `redwoodjs`

## [0.0.1-alpha.10.1] - 2019-10-23

### Added

- `WithCell` and `useCell` query resolvers.
- Typescript support in our ESLint configuration.

### Changed

- `hammer-api` now exports submodules, so all graphql things are
  available in `@hammerframework/hammer-api/graphql`.
- `hammer-dev-server` no longer clears the screen.

## [0.0.1-alpha.9] - 2019-09-29

### Changed

- ESLint configuration errors on import ordering, with the idea that
  fix on save sorts the imports automatically.

### Added

- `hammer-web` package.
- `hammer-api` package.
