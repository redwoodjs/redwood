# Overview

- Main validation layer/model for Redwood (used by the Redwood CLI and other tools)
- Used by Decoupled Studio to provide IDE features
- Other IDEs can leverage language-server.ts

# Structure

- `/project.ts`: The main API and classes (such as Project, Page, Service, Side, etc)
- TODO: `/language-server.ts`: A [Language Server Protocol](https://microsoft.github.io/language-server-protocol/) implementation that wraps the `project` classes
- TODO: `/typescript-language-service-plugin`: A TypeScript language service plugin for Redwood.

# Usage

The most common use-case is getting the diagnostics of a complete redwood project:

```ts
import { Project } from "./project";
async function test() {
  const project = new Project({ projectRoot: "/foo/bar" });
  for (const d of await project.getAllDiagnostics()) {
    console.log(d.diagnostic.severity + ": " + d.diagnostic.message);
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
import { Project } from "./project";
const project = new Project({ projectRoot: "/foo/bar" });
for (const route of project.web.router.routes) {
  console.log(route.path + (route.isPrivate ? " (private)" : ""));
}
// /
// /about
// /product/{id}
// /admin (private)
```

You can also get nodes by `id`. For example:

```ts
import { Project } from "./project";
const project = new Project({ projectRoot: "/foo/bar" });
const router = project.findNode("/foo/bar/web/src/Routes.js");
```

(You can read more about `id`s below).

In most cases, if you just want to get the node for a given file, you don't even need to create a project by hand:

```ts
import { findNode } from "./project";
findNode("/foo/bar/web/src/Routes.js")?.diagnostics?.length; // 8
```

The findNode utility method will recursively look for a redwood.toml file to identify where the project root might be.

# Diagnostics

The Diagnostics API/structures are based on the Language Server Protocol.

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
  - id: `"/project/root"`
  - webSide: (WebSide)
    - id: `"/project/root/web"`
    - router: (Router)
      - id: `"/project/root/web/src/Routes.js"`
      - routes[0]: (Route)
        - id: `"/project/root/web/src/Routes.js /home"` (notice that this id has two elements - it is an "internal" node)

An id is "usually" a file or folder.

Anatomy of an id:

- An id is a string.
- It has components separated by spaces.
- the first component is always a filePath (or folder path).
- The rest are optional, and only exist when the node is internal to a file.

## Mutations

- The project graph is immutable: If the underlying files change, you must create a new project.
- This allows us to keep the logic clean and focused on capturing the "rules" that are unique to a Redwood app (most importantly, diagnostics). Other concerns such as change management, reactivity, etc, can be added on top
- Having said that, the graph also provides some ways of modifying your Redwood apps. For example:

```ts
import { Project } from "./project";
const project = new Project({ projectRoot: "/foo/bar" });
// lets find the "/home" page and delete it
const home = project.web?.router?.routes?.find((r) => r.path === "/home");
if (home) {
  const edits = home.remove();
  // returns a list of edits that need to be applied to your project's files
  // in this case, some file deletions and some file modifications
}
```

Some diagnostics provide a "quickFix", which is a list of edits that will "fix" the error.

For example, let's create an empty "page" file and then get its diagnostics:

```ts
import { findNode } from "./project";
const pageNode = findNode("/foo/bar/web/src/pages/AboutUs/AboutUs.js");
pageNode.diagnostics[0].message; // this Page is empty
pageNode.diagnostics[0].quickFix.edits; // a list of edits to fix the problem
pageNode.diagnostics[0].quickFix.edits.apply();
```

You can apply the edits

## Abstracting File System Access

To allow use cases like dealing with unsaved files in IDEs, some filesystem methods can be overriden via the Host interface.

## Sync VS Async

When possible, the project graph is constructed synchronously. There are only a few exceptions. This simplifies the domain logic and validations, which is the main driver behind the project model itself.
