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

| Name          | Value                                                                                                                                                                                                         | Required |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `name`        | The name of the generator                                                                                                                                                                                     | Yes      |
| `command`     | The command line input that triggers the generator                                                                                                                                                            | Yes      |
| `description` | Text that is shown on the generator's help message                                                                                                                                                            | Yes      |
| `files`       | A function which accepts a single argument (the first string after the name of generator when called from the command line). Returns an object containing filenames and contents of those files to be created | No       |
| `routes`      | A function which accepts a single argument (the first string after the name of the generator when called from the command line). Returns an array of `<Route>` tags to append to the Routes.js file           | No       |

An example generator's return:

```javascript
{
  name: "Page",
  command: "page",
  description: "Generates a Hammer page component",
  files: name => ({
    'pages/FooPage/FooPage.js': 'const FooPage = () => { ... }'
  }),
  routes: name => (['<Route path="/foo" page={FooPage} name="foo" />'])
}
```
