# ESLint Plugin

Standalone RedwoodJS lint rules for ESLint.
These rules are also available via the larger [`@redwoodjs/eslint-config`](https://github.com/redwoodjs/redwood/tree/main/packages/eslint-config).

## Usage

In your "flat" ESLint config file:

```js
import redwoodjs from "@redwoodjs/eslint-plugin";

export default [
  redwoodjs.configs.recommended,
];
```

## Contributing

This package doesn't depend on other Redwood Framework packages.
To contribute, you should be familiar with the ESLint package.
Keep in mind that any rules added should not conflict with code formatting tools (e.g. [Prettier](https://prettier.io/docs/en/integrating-with-linters.html)).
