# Update Jest Config

This codemod updates jest config to take advantage of the changes made in [#4096](https://github.com/redwoodjs/redwood/pull/4096).

- add a root `jest.config.{js,ts}`
  - https://github.com/redwoodjs/redwood/blob/b04a032556b5e1b1807d1086c2d37106ad6e7348/packages/create-redwood-app/template/jest.config.js
- modify api/web `jest.config.{js,ts}`s, taking care to respect custom config
  - api https://github.com/redwoodjs/redwood/blob/b04a032556b5e1b1807d1086c2d37106ad6e7348/packages/create-redwood-app/template/api/jest.config.js
  - web https://github.com/redwoodjs/redwood/blob/b04a032556b5e1b1807d1086c2d37106ad6e7348/packages/create-redwood-app/template/web/jest.config.js
