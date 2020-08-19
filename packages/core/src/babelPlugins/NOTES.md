# Redwood's Babel Plugins

Redwood has some magic, it's nothing too powerful and in reality it's just a bit of wand waving that produces pretty colours and sparks, nothing that should warrant the setting up of bonfires, but I digress, the wand is a Babel stick and these are the spells:

### Cells

Files ending with `Cell.{ts,js}` are inspected to determine if they're actual Cells, if they are we wrap them in `withCell` that allows them to run the JavaScript lifecycle methods.

###  Import Directory

We look for "*" in an import statement and import the contents of a directory into an object.

###  Routes auto loader

We automatically import your `Pages` into `Routes.js`

###  Mock Cell Data

We have some specific workflows for adding mock data to Storybook and Jest for GraphQL requests.

## What to do about TypeScript?

Because these plugins introduce non-standard functionality it's impossible for TypeScript to figure out what's going on, so we generates types for them; the types are place in `node_modules/@types/redwoodjs` and they're automatically picked up.
