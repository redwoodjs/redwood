---
description: How Prisma relations work with scaffolds
---

# Prisma Relations and Redwood's Generators

These docs apply to Redwood v0.25 and greater. Previous versions of Redwood had limitations when creating scaffolds for any one-to-many or many-to-many relationships. Most of those have been resolved so you should definitely [upgrade to 0.25](https://community.redwoodjs.com/t/upgrading-to-redwoodjs-v0-25-and-prisma-v2-16-db-upgrades-and-project-code-mods/1811) if at all possible!

## Many-to-many Relationships

[Here](https://www.prisma.io/docs/concepts/components/prisma-schema/relations#many-to-many-relations)
are Prisma's docs for creating many-to-many [relationships](https://www.prisma.io/docs/concepts/components/prisma-schema/relations) - A many-to-many
relationship is accomplished by creating a "join" or "lookup" table between two
other tables. For example, if a **Product** can have many **Tag**s, any given
**Tag** can also have many **Product**s that it is attached to. A database
diagram for this relationship could look like:

```
┌───────────┐     ┌─────────────────┐      ┌───────────┐
│  Product  │     │  ProductsOnTag  │      │    Tag    │
├───────────┤     ├─────────────────┤      ├───────────┤
│ id        │────<│ productId       │   ┌──│ id        │
│ title     │     │ tagId           │>──┘  │ name      │
│ desc      │     └─────────────────┘      └───────────┘
└───────────┘
```

The `schema.prisma` syntax to create this relationship looks like:

```jsx
model Product {
  id       Int    @id @default(autoincrement())
  title    String
  desc     String
  tags     Tag[]
}

model Tag {
  id       Int     @id @default(autoincrement())
  name     String
  products Product[]
}
```

These relationships can be [implicit](https://www.prisma.io/docs/concepts/components/prisma-schema/relations#implicit-many-to-many-relations) (as this diagram shows) or [explicit](https://www.prisma.io/docs/concepts/components/prisma-schema/relations#explicit-many-to-many-relations) (explained below). Redwood's SDL generator (which is also used by the scaffold generator) only supports an **explicit** many-to-many relationship when generating with the `--crud` flag. What's up with that?

## CRUD Requires an `@id`

CRUD (Create, Retrieve, Update, Delete) actions in Redwood currently require a single, unique field in order to retrieve, update or delete a record. This field must be denoted with Prisma's [`@id`](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference#id) attribute, marking it as the tables's primary key. This field is guaranteed to be unique and so can be used to find a specific record.

Prisma's implicit many-to-many relationships create a table _without_ a single field marked with the `@id` attribute. Instead, it uses a similar attribute: [`@@id`](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference#id-1) to define a *multi-field ID*. This multi-field ID will become the tables's primary key. The diagram above shows the result of letting Prisma create an implicit relationship.

Since there's no single `@id` field in implicit many-to-many relationships, you can't use the SDL generator with the `--crud` flag. Likewise, you can't use the scaffold generator, which uses the SDL generator (with `--crud`) behind the scenes.

## Supported Table Structure

To support both CRUD actions and to remain consistent with Prisma's many-to-many relationships, a combination of the `@id` and [`@@unique`](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference#unique-1) attributes can be used. With this, `@id` is used to create a primary key on the lookup-table; and `@@unique` is used to maintain the table's unique index, which was previously accomplished by the primary key created with `@@id`.

> Removing `@@unique` would let a specific **Product** reference a particular **Tag** more than a single time.

You can get this working by creating an explicit relationship—defining the table structure yourself:

```jsx
model Product {
  id    Int         @id @default(autoincrement())
  title String
  desc  String
  tags  ProductsOnTag[]
}

model Tag {
  id       Int      @id @default(autoincrement())
  name     String
  products ProductsOnTag[]
}

model ProductsOnTag {
  id        Int     @id @default(autoincrement())
  tagId     Int
  tag       Tag     @relation(fields: [tagId], references: [id])
  productId Int
  product   Product @relation(fields: [productId], references: [id])

  @@unique([tagId, productId])
}
```

Which creates a table structure like:

```
┌───────────┐      ┌──────────────────┐     ┌───────────┐
│  Product  │      │  ProductsOnTags  │     │    Tag    │
├───────────┤      ├──────────────────┤     ├───────────┤
│ id        │──┐   │ id               │  ┌──│ id        │
│ title     │  └──<│ productId        │  │  │ name      │
│ desc      │      │ tagId            │>─┘  └───────────┘
└───────────┘      └──────────────────┘

```

Almost identical! But now there's an `id` and the SDL/scaffold generators will work as expected. The explicit syntax gives you a couple additional benefits—you can customize the table name and even add more fields. Maybe you want to track which user tagged a product—add a `userId` column to `ProductsOnTags` and now you know.

## Troubleshooting Generators
### Errors when Generating SDL or Scaffolds for Relations

There is a known issue in the RedwoodJS 1.0 GraphQL type generation that happens while using the Schema Definition Language (SDL) and Scaffold generators with a Prisma schema that contains related models **before both models** exist.

This can be an easy situation to get into if you begin to model out your entire schema (with relations) from the start -- or you [introspect](https://www.prisma.io/docs/concepts/components/introspection) an existing schema.

#### Example of Type Generation Error with Relations

For example, consider this simple model for a Bookshelf:

1. Create both the `Book` and `Shelf` models with relation (at the same time in a single migration).

Here is a Book that is on a Shelf. And a Shelf has many Books.

```
model Book {
  id      Int    @id @default(autoincrement())
  title   String @unique
  Shelf   Shelf? @relation(fields: [shelfId], references: [id])
  shelfId Int?
}

model Shelf {
  id    Int    @id @default(autoincrement())
  name  String @unique
  books Book[]
}
```

2. `yarn rw prisma migrate dev`

3. Now, I want sdls and services (or perhaps you scaffold a `Book`).

`yarn rw g sdl Book`

4. The sdl and service files **do generate**:

```bash
 ✔ Generating SDL files...
    ✔ Successfully wrote file `./api/src/graphql/books.sdl.js`
    ✔ Successfully wrote file `./api/src/services/books/books.scenarios.js`
    ✔ Successfully wrote file `./api/src/services/books/books.test.js`
    ✔ Successfully wrote file `./api/src/services/books/books.js`
```

5. **But**, when generating types, the schema fails to load **because** `Book` needs `Shelf` to exist, be we haven't yet created a `Shelf`. A book needs a shelf and vice versa, but here type generation doesn't yet know a shelf exists.

See: `Error: Unknown type:` below for an example of what this error looks like.

```
  ⠙ Generating types ...
Failed to load schema

//...

type Query {
  redwood: Redwood
},graphql/**/*.sdl.{js,ts},directives/**/*.{js,ts}:

        Unknown type: "Shelf".
        Error: Unknown type: "Shelf".
```

6. Even if you now generate a `Shelf`, you'll still have that error because `Book` depends on `Shelf`.

#### How to Fix Type Generation Error with Relations

The easiest way to solve this error is to:

1. First, **remove all** the relations

```
model Book {
  id      Int    @id @default(autoincrement())
  title   String @unique
}

model Shelf {
  id    Int    @id @default(autoincrement())
  name  String @unique
}
```

2. Then, **migrate** so that both `Book` and `Shelf` exist as separate models -- just without relations for now.

 `yarn rw prisma migrate dev`

 3. Next, generate the SDL (or scaffold) for each model separately

 `yarn rw g sdl Book`
 `yarn rw g sdl Shelf`

4. After that, setup the relationships a you had originally:

```
model Book {
  id      Int    @id @default(autoincrement())
  title   String @unique
  Shelf   Shelf? @relation(fields: [shelfId], references: [id])
  shelfId Int?
}

model Shelf {
  id    Int    @id @default(autoincrement())
  name  String @unique
  books Book[]
}
```

5. Then **migrate** again to create the relationships in the database

 `yarn rw prisma migrate dev`

 6. Last, regenerate your SDL (but you will need to `force` to overwrite existing files and use the `no-tests` to preserve your tests and scenario files if needed)

`yarn rw g sdl Book --force --no-tests`
`yarn rw g sdl Shelf --force --no-tests`

Now you have a schema, SDL, service that correctly represents your models and relationships.

### Self-Relation Tips

[Self-relations](https://www.prisma.io/docs/concepts/components/prisma-schema/relations/self-relations#one-to-many-self-relations) are useful when you need to have a recursive relationship of the same model. You can see this often in business/academic organizational charts, building structures, or family trees where the "parent" and the "children" are the "same type of thing".

For example, in a business everyone is an "Employee" with some defined role and some possible direct reports.

* President - each business has one President
* Director - reports to the President
* Manager - reports to a Director
* Employee - reports to a Manager, but has no direct reports

```
model Employee {
  id            Int       @id @default(autoincrement())
  name          String
  jobTitle      String
  reportsToId   Int?      @unique
  reportsTo     Employee? @relation("OrgChart", fields: [reportsToId], references: [id])
  directReports Employee? @relation("OrgChart")
}
```

What is important here for the RedwoodJS generators is that the related models **be optional**. That is, the `reportsToId`, `reportsTo`, and `directReports` use Prisma's `?` syntax to indicate that the item is not required.

That's because if you are at the top, say you are the President, then you don't have a `reportsTo` and if you are simply an Employee, then you do not have anyone that directly reports to you.

> The Redwood generators may complain or fail if you try to force a requirement here. If that happens, please set these to be optional.

You can find more information about self-relations in the [Prisma documentation](https://www.prisma.io/docs/concepts/components/prisma-schema/relations/self-relations#one-to-many-self-relations).

