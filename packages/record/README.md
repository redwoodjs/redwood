# RedwoodRecord

RedwoodRecord is an ORM ([Object-Relational Mapping](https://en.wikipedia.org/wiki/Object%E2%80%93relational_mapping)) built on top of Prisma. It may be extended in the future to wrap other database access packages.

RedwoodRecord is heavily inspired by [ActiveRecord](https://guides.rubyonrails.org/active_record_basics.html) which ships with [Ruby on Rails](https://rubyonrails.org). It presents a natural interface to the underlying data in your database, without worry about the particulars of SQL syntax.

## Background and Terminology

Before you can use RedwoodRecord you need to create classes for each database table you intend to access. Let's say we had a blog with three database tables:

```
┌───────────┐       ┌────────────┐      ┌────────────┐
│   User    │       │    Post    │      │  Comment   │
├───────────┤       ├────────────┤      ├────────────┤
│ id        │•──┐   │ id         │•──┐  │ id         │
│ name      │   └──<│ userId     │   └─<│ postId     │
│ email     │       │ title      │      │ name       │
└───────────┘       │ body       │      │ message    │
                    └────────────┘      └────────────┘
```

In database-speak we say that these tables have a *one-to-many* relationships between them when moving from left to write in the diagram above: one User can have many Posts associated to it, and a Post can have many Comments. The "one" is denoted with a `•` on the arrow above and a `<` denotes the "many."

You can leave it at that, as saying one-to-many explains both sides of the relationship, but it's sometimes convenient to refer to the relation in the "opposite" direction. Reading the diagram from right to left we could say that a comment *belongs to* a post (it has a foreign key `postId` that points to Post via `Comment.postId` -> `Post.id`) and a Post belongs to a User (`Post.userId` -> `User.id`)

There are also *many-to-many* relationships, such as a Product and Category—a Product can have many different Categories, and a Category will have many different Products connected to it:

```
┌───────────┐       ┌────────────┐
│  Product  │       │  Category  │
├───────────┤       ├────────────┤
│ id        │>─────<│ id         │
│ name      │       │ name       │
│ upc       │       │ shelf      │
└───────────┘       └────────────┘
```

These tables don't have any foreign keys (`productId` or `cateogryId`), how do they keep track of each other? Generally you'll create a *join table* between the two that references each other's foreign key:

```
┌───────────┐      ┌───────────────────┐       ┌────────────┐
│  Product  │      │  ProductCategory  │       │  Category  │
├───────────┤      ├───────────────────┤       ├────────────┤
│ id        │•────<│ productId         │   ┌──•│ id         │
│ name      │      │ categoryId        │>──┘   │ name       │
│ upc       │      └───────────────────┘       │ shelf      │
└───────────┘                                  └────────────┘
```

Now we're back to one-to-many relationships. In Prisma this join table is created and maintained for you. It will be named `_CategoryToPost` and the foreign keys will simply be named `A` and `B` and point to the two separate tables. Prisma refers to this as an [implicit many-to-many](https://www.prisma.io/docs/concepts/components/prisma-schema/relations/many-to-many-relations#implicit-many-to-many-relations) relationship.

If you want to create the join table yourself and potentially store additional data there (like a timestamp of when the product was categorized) then this is simply a one-to-many relationship on both sides: a Product has many ProductCategories and a Category has many ProductCategories. Prisma refers to this as an [explicity many-to-many](https://www.prisma.io/docs/concepts/components/prisma-schema/relations/many-to-many-relations#explicit-many-to-many-relations) relationship.

> TODO: We'll be adding logic soon that will let you get to the categories from a product record (and vice versa) in explicit many-to-manys without having to manually go through ProductCategory. From this:
>
>     const product = Product.find(1)
>     const productCategoryes = product.productCategories.all()
>     const categories = productCategories.map(pc => pc.categories.all()).flat()
>
> To this:
>
>     const product = Product.find(1)
>     const categories = product.categories.all()

The only other terminology to keep in mind are the terms *model* and *record*. A *model* is the name for the class that represents one database table. The example above has three models: User, Post and Comment. Prisma also calls each database table declaration in their `schema.prisma` declaration file a "model", but when we refer to a "model" in this doc it will mean the class that extends `RedwoodRecord`. A *record* is a single instance of our model that now represents a single row of data in the database.

So: I use the User model to find a given user in the database, and, assuming they are found, I now have a single user record (an instance of the User model).

## Usage

First you'll need to create a model to represent the database table you want to access. In our blog example, let's create a User model:

```javascript
// api/src/models/User.js

export default class User extends RedwoodRecord { }
```

Now we need to parse the Prisma schema, store as a cached JSON file, and create an `index.js` file with a couple of config settings:

```
yarn rw record init
```

You'll see that this created `.redwood/datamodel.json` and `api/src/models/index.js`.

Believe it or not, that's enough to get started! Let's try using the Redwood console to make some quick queries without worrying about starting up any servers:

> TODO: Models don't quite work correctly in the console. My guess is something Babel-related. The require and fetching of records below will work, but actually trying to read any properties returns `undefined`.

```
yarn rw c
```

Now we've got a standard Node REPL but with a bunch of Redwood goodness loaded up for us already. First, let's require our model:

```javascript
const User = require('./api/src/models/User')
```

You could also import from the `index.js` file that's created:

```javascript
const { User } = require('./api/src/models')
```

And now we can start querying and modifying our data:

```javascript
User.all()
const newUser = User.create({ name: 'Rob', email: 'rob@redwoodjs.com' })
newUser.name = 'Robert'
newUser.save()
User.find(1)
User.findBy({ email: 'rob@redwoodjs.com' })
newUser.destroy()
```

### Finding Records

* where()
* all()
* find()
* findBy()
* Passing more options like orderBy

### Creating Records

* User.create()
* User.build(), instance.save()

### Updating Records

User.update()
instance.save()

### Deleting Records

User.destroy()
instance.destroy()

### Relationships

#### One-to-many

#### Belongs To

#### Many-to-many

### Validations

### Lifecycle
