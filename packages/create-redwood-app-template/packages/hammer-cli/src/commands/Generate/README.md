## Creating a Generator

Generators go in `src/commands/Generate/generators` and should be named for the generate command that invokes them (not required). For example, for page generator invoked with:

    hammer generate page foo

you would create `src/commands/Generate/generators/page.js`. The file name does not have to match the generator command (the name is pulled from the object returned when importing the generator) but it is clearest to have the command and the name match.

You need to import your generator at the top of `src/commands/Generate/Generate.js` and include it in the list of `DEFAULT_GENERATORS`:

```javascript
import component from './generators/component'
import page from './generators/page'

const DEFAULT_GENERATORS = [component, page]
```

The generator must export a default hash containing the following keys:

| Name          | Value                                                                                                                                                                                                                                                                | Required |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `name`        | The name of the generator                                                                                                                                                                                                                                            | Yes      |
| `command`     | The command line input that triggers the generator                                                                                                                                                                                                                   | Yes      |
| `description` | Text that is shown on the generator's help message                                                                                                                                                                                                                   | Yes      |
| `files`       | A function which accepts the array of arguments given to the `hammer` command. Returns an object containing filenames and contents of those files to be created                                                                                                      | No       |
| `routes`      | A function which accepts the array of arguments given to the `hammer` command. Returns an array of `<Route>` tags to append to the Routes.js file                                                                                                                    | No       |
| `generate`    | A function which accepts the array of arguments given to the `hammer` command. Returns an array of an array of arguments that would be passed to the Generate function in the same order the commands would be sent in from a command line call to `hammer generate` | No       |

An example generator's return:

```javascript
{
  name: "Page",
  command: "page",
  description: "Generates a Hammer page component",
  files: name => ({
    'pages/FooPage/FooPage.js': 'const FooPage = () => { ... }'
  }),
  routes: name => (['<Route path="/foo" page={FooPage} name="foo" />']),
  generate: name => ([['service', 'foo']])
}
```

## Templates

Templates for the files created by generators go in `src/commands/Generate/templates` and should be named after the command that invokes your generator. The files inside should end in `.template` to avoid being compiled by Babel.

    src/commands/Generate/
    ├── generators
    │   ├── component.js
    │   └── page.js
    └── templates
        ├── component
        │   ├── component.js.template
        │   ├── readme.mdx.template
        │   └── test.js.template
        └── page
            └── page.js.template
