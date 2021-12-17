# Updates/Removes babel config

This codemod does the following

### Part 1: Check root of project for babel.config.js
If any custom config is present, error out. As we cannot determine which side the config should apply to.

If no custom config is present, remove this file.


### Part 2: check web/.babelrc.js
If any custom config is present, rename this file to babel.config.js and remove the "extends" property.

If no custom config is present, remove this file.

