## Heroku deploy module
### Project changes
1. creates a new dev heroku nodejs build
2. creates a custom nginx proxy for serving the api
3. creates the smallest postgres possible instance (~$5/mo)
3. adds proper heroku scripts to package.js
4. sets prisma database to postgres
5. adds PM2 process manager for api as well as dotenv to gather heroku environment

### Description of archiecture.

- Heroku deploy interfaces follow CLEAN principles. [read more here](https://gist.github.com/wojteklu/73c6914cc446146b8b533c0988cf8d29)
- The core state is wrapped in a single context which flows through all of the steps. Steps are executed in order from the root handler in `src/commands/deploy/heroku` and can be added simply by accepting a context and returning it.
- The process spawner is dependency injected - vis a vis - A single instance of the "spawner" is passed through all steps but can be modified per call. *as an aside: Be careful passing the `{ shell: true }`. use sparingly as it is not cross platform, increases execution time, and allows for malicious command execution.*
- All functions "pure" (with the unavoidable exceptions like `process` and `console`) [read more here](https://en.wikipedia.org/wiki/Pure_function)

### Sub modules
- `ctx` main command context. The users system verification checks, spawner, etc are all built here.
- `stdio` all i/o operations (spawning processes, logging, etc)
- `api` is the raw interface for the heroku cli
- `predeploy` all steps required before heroku app is created and pushed
- `addendum`, `confirmation`, and `messages` are all user facing feedback interfaces

TODO:
- Support windows
- Offer system setup options (install heroku, homebrew)
- Configure pipelines with deploy previews
- Database selection
- Fine grained options / a main manifest
