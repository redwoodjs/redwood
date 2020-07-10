# Overview

- Main validation layer/model for Redwood (used by the Redwood CLI and other tools)
- Used by Decoupled Studio and other tools to provide IDE features

## Structure

- `/model/*`: The main API and classes (such as RWProject, RWPage, RWService, etc)
- `/language_server/*`: A [Language Server Protocol](https://microsoft.github.io/language-server-protocol/) implementation that wraps the `model` classes.

# Usage

The most common use-case is getting the diagnostics of a complete redwood project:

```ts
import { getProject } from '@redwoodjs/project-model'
async function test() {
  const project = getProject('/path/to/app')
  for (const d of await project.collectDiagnostics()) {
    console.log(d.diagnostic.severity + ': ' + d.diagnostic.message)
  }
}
// ...
// error: Router must have only one "notfound" page
// error: Duplicate path in router: '/about-us'
// error: Parameter "id" in route '/product/{id}' does not exist on ProductPage
// error: PostsCell is missing the "Success" exported const
// error: Property "emial" does not exist on "User" model
// warning: Unused page AboutUs.js
```

Note: Gathering _all_ diagnostics is expensive. It will trigger the creation of the complete project graph.
You can also traverse the graph to get more specific information.

For example: Iterating over the routes of a redwood project:

```ts
import { getProject } from '@redwoodjs/project-model'
const project = getProject('/path/to/app')
for (const route of project.router.routes) {
  console.log(route.path + (route.isPrivate ? ' (private)' : ''))
}
// /
// /about
// /product/{id}
// /admin (private)
```

# Design Notes

- The project is represented by an AST of sorts
- Nodes are created lazily as the user traverses properties
- There is extensive caching going on under the hood. **If the underlying project changes, you need to create a new project**

## id

- Each node in the graph has an `id` property.
- ids are unique and stable
- They are organized in a hierarchical fashion (so the graph can be flattened as a tree)
- Requesting a node using its id will not require the complete project to be processed. Only the subset that is needed (usually only the node's ancestors). This is important to enable efficient IDE-like tooling to interact with the project graph and get diagnostics for quickly changing files.

Here are some examples of ids:

- (Project)
  - id: `"file:///project/root"`
    - router: (Router)
      - id: `"file:///project/root/web/src/Routes.js"`
      - routes[0]: (Route)
        - id: `"file:///project/root/web/src/Routes.js /home"` (notice that this id has two elements - it is an "internal" node)

An id is "usually" a file or folder.

Anatomy of an id:

- An id is a string.
- It has components separated by spaces.
- the first component is always a file URI (or folder URI).
- The rest are optional, and only exist when the node is internal to a file.

## Mutations

- The project graph is immutable: If the underlying files change, you must create a new project.
- This allows us to keep the logic clean and focused on capturing the "rules" that are unique to a Redwood app (most importantly, diagnostics). Other concerns such as change management, reactivity, etc, can be added on top

## Abstracting File System Access

To allow use cases like dealing with unsaved files in IDEs, some filesystem methods can be overriden via the Host interface.

## Sync VS Async

When possible, the project graph is constructed synchronously. There are only a few exceptions. This simplifies the domain logic and validations, which is the main driver behind the project model itself.
