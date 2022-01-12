# Quick Start

>RedwoodJS requires [Node.js](https://nodejs.org/en/) (>=14.x <=16.x) and [Yarn](https://classic.yarnpkg.com/en/docs/install/) (>=1.15).

Run the following command to create a new Redwood project in a "my-redwood-app" project directory.
```
  yarn create redwood-app my-redwood-app
```
Start the development server:
```
   cd my-redwood-app
   yarn redwood dev
```
A browser should automatically open to http://localhost:8910 and you will see the Redwood welcome page.

## The Redwood CLI

The Redwood developer experience relies heavily on the Redwood CLI. It's installed as a dependency when you create a new redwood-app, and is run locally in your app.

The following will show all the available commands in the Redwood CLI (note: rw is alias of redwood):
```
yarn rw --help
```

Some commands, like [prisma](https://redwoodjs.com/docs/cli-commands#db), have a lot of options. You can dig further into a specific command by adding `--help` to the command like so:
```
yarn rw prisma --help
```

Take a visit to the [CLI Doc](https://redwoodjs.com/docs/cli-commands.html) to see detailed information on all commands and options.

## Generators

Redwood generators make monotonous developer tasks a breeze. Creating all the boilerplate code required for CRUD operations on a model can be accomplished with a few commands. Three to be exact. 

Every new Redwood project comes with a default Model called UserExample in `api/db/schema.prisma` (ignore the rest of the file for now, it's for more advanced configuration data).

```
model UserExample {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String?
}
```

With only two commands, Redwood will create everything we need for our CRUD operations:
```
yarn rw prisma migrate dev
yarn rw generate scaffold UserExample
```

What exactly just happened? Glad you asked.

- `yarn rw prisma migrate dev` creates and applies a snapshot of our UserExample model for our migration, creating a new table in our database called `UserExample`
- `yarn rw generate scaffold UserExample` tells Redwood to create the necessary Pages, SDL, and Services for the given Model 

Just like that, we are done. No seriously. Visit http://localhost:8910/user-examples to see for yourself. 

<img width="463" alt="Screen Shot 2020-10-21 at 6 28 08 PM" src="https://user-images.githubusercontent.com/2951/96807389-3eede900-13cb-11eb-828a-52210cd67e3e.png">

Redwood has created everything we need to create, edit, delete and view a User. And you didn't have to write one line of boilerplate code. 

We have some other [generators](https://redwoodjs.com/docs/cli-commands#generate-alias-g) that are just as awesome, don't forget to check them out as well.

## Next Steps

Need more? The best way to get to know Redwood is by going through the extensive [Redwood Tutorial](https://redwoodjs.com/tutorial/welcome-to-redwood).

- Join our [Discord Server](https://discord.gg/redwoodjs)
- Join our [Discourse Community](https://community.redwoodjs.com)
