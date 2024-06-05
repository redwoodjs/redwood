# Database Seeds

Seeds are data that are required in order for your app to function. Think of
the data a new developer would need to get up and running with your codebase, or
data that needs to exist when a new instance of your application is deployed to
a new environment.

Seed data are things like:

* An admin user so that you can log in to your new instance
* A list of categories that can be assigned to a Product
* Lists of roles and permissions

Seed data is not meant for:

* Sample data to be used in development
* Data to run tests against
* Randomized data

If at all possible, seed data should be idempotent: you should be able to
execute the seed script against your database at any time and end up with the
seed data properly populated in the database. It should not result in wiping
out existing records or creating duplicates of any seeded data that is already
present.

## When seeds run

Seeds are automatically run the first time you migrate your database:

```bash
yarn rw prisma migrate dev
```

They are run *every* time you reset your database:

```bash
yarn rw prisma migrate reset
```

You can manually run seeds at any time with the following command:

```
yarn rw prisma db seed
```

You generally don't need to keep invoking your seeds over and over again, so it
makes sense that Prisma only does it on a complete database reset, or when the
database is created with the first `prisma migrate dev` execution.

Unless you reset your database often, they'll never run again, which is why you
may need to manually run them from time to time as you add data.

## Creating seed data

Take a look at `scripts/seed.js` (or `.ts` depending on whether you're working
on a Typescript project):

```javascript
export default async () => {
  try {
    const data = []

    for (const item of data) {
    }

    console.info(
      '\n  No seed data, skipping. See scripts/seed.ts to start seeding your database!\n'
    )
  } catch (error) {
    console.error(error)
  }
}
```

Comments have been removed for clarity. The seed file contains a barebones
skeleton with an array of `data` and a loop which runs for every record present.

Let's create some categories for a bookstore. For this example, assume the
`Category` model has a unique constraint on the `name` field:

```javascript
export default async () => {
  try {
    const data = [
      { name: 'Art' },
      { name: 'Biography' },
      { name: 'Fiction' },
      { name: 'Non-fiction' },
      { name: 'Travel' },
      { name: 'World History' }
    ]

    for (const item of data) {
      await db.category.upsert({ 
        where: { name: item.name },
        update: { name: item.name },
        create: { name: item.name } 
      })
    }
  } catch (error) {
    console.error(error)
  }
}
```

You can now execute this seed as many times as you want and you'll end up with
that exact list in the database each time (and any additional categories you've
created in the meantime).

# Seeding users for dbAuth

If using dbAuth and seeding users, you'll need to add a `hashedPassword` and
`salt` using the same algorithm that dbAuth uses internally so they can be
verified. Here's one way to do that:

```javascript
import { hashPassword } from '@redwoodjs/auth-dbauth-api'

export default async () => {
  const users = [
    { name: 'John', email: 'john@example.com', password: 'secret1' },
    { name: 'Jane', email: 'jane@example.com', password: 'secret2' }
  ]

  for (const user of users) {
    const [hashedPassword, salt] = hashPassword(user.password)

    await db.user.upsert({
      where: { 
        email: user.email 
      },
      create: { 
        name: user.name,
        email: user.email,
        hashedPassword,
        salt
      },
      update: {
        name: user.name,
        hashedPassword,
        salt
      }
    })
  }
}
```

## Performance

Prisma is faster at execting a `createMany()` instead of many `create` or
`upsert` functions. Unfortunately, you lose the ability to easily make your seed
idempotent with a single function call.

One solution would be to start with the full array of data and first check to
see whether those records already exist in the database. If they do, create two
arrays: one for records that don't exist and run `createMany()` with them, and
the second list for records that do exist, and run `updateMany()` on those.

Unfortunately this relies a ton of select queries, which may negate the
performance benefits of `createMany()`.

## What if I don't need seeds?

In order to stop automatically executing seeds with the `prisma migrate`
commands you can remove the following lines from `package.json` in the root of
your app:

```json
"prisma": {
  "seed": "yarn rw exec seed"
},
```

You can then delete the `scripts/seed.js` file.
