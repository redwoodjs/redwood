# Our Internals

This package is not intended to be used directly by users of [Redwood](https://redwoodjs.com), this offers functionality to parse the Redwood configurations and a way to get a project's paths.

## Paths

### The base directory

Redwood is anchored to a single `redwood.toml` file. We use this to determine the base directory of a project.

### Sides

Redwood separates your project into sides, by default we have a "web side" and an "api side." Each side has a target ("browser" for "web" and "node" for "api"). We use the concept of sides and targets to determine how to build, test, lint and manage your project.