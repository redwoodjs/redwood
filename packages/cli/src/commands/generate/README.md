# Generators
RedwoodJS CLI tools are built with Yargs:
- http://yargs.js.org/
- https://github.com/yargs/yargs

## Creating a Generator

Generators go in `src/commands/generate` and should be named for the generate command that invokes them (not required). For example, for page generator invoked with:

    redwood generate page foo

you would create `src/commands/generate/page/page.js`. The file name does not have to match the generator command (the name is pulled from the object returned when importing the generator) but it is clearest to have the command and the name match.

The generator must export the following:

`command`: A yargs command definition.
`desc`: A description of the generator shown during help.
`builder`: A function that describes the arguments for the command.
`handler`: The function that's invoked by the command.

A typicall generator writes files.

## Templates

Templates for the files created by generators go in `src/commands/generate/[name]/templates` and should be named after the command that invokes your generator. The files inside should end in `.template` to avoid being compiled by Babel.

    src/commands/generate/
    └── page
        ├── templates
        │   ├── page.js.template
        │   └── test.js.template
        └── page.js
