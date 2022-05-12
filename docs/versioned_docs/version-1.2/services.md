---
description: Put all your business logic in one place
---

# Services

Redwood aims to put all your business logic in one place—Services. These can be used by your GraphQL API or any other place in your backend code. Redwood does all the annoying stuff for you, just write your business logic!

## Overview

What do we mean by "business logic?" [One definition](https://www.investopedia.com/terms/b/businesslogic.asp) states: "Business logic is the custom rules or algorithms that handle the exchange of information between a database and user interface." In Redwood, those custom rules and algorithms go in Services. You can't put that logic in the client because it's open to the world and could be manipulated. Imagine having the code to determine a valid withdrawal or deposit to someone's bank balance living in the client, and the server just receives API calls of where to move the money, doing no additional verification of those numbers! Your bank would quickly go insolvent. As you'll hear many times throughout our docs, and your development career—never trust the client.

But how does the client get access to the output of these Services? By default, that's through GraphQL. GraphQL is an API, accessible to clients, that relies on getting data from "somewhere" before returning it. That somewhere is a function backed by what's known as a [**resolver**](https://graphql.org/learn/execution/) in GraphQL. And in Redwood, those resolvers are your Services!

```
┌───────────┐      ┌───────────┐      ┌───────────┐
│  Browser  │ ───> │  GraphQL  │ ───> │  Service  │
└───────────┘      └───────────┘      └───────────┘
```

Remember: Service are just functions. That means they can be used not only as GraphQL resolvers, but from other Services, or serverless functions, or anywhere else you invoke a function on the api side.

> **Can I use Service functions on the web side?**
>
> The short answer is no because our build process doesn't support it yet.
>
> Generally, in a full-stack application, Services will concern themselves with getting data in and out of a database. The libraries we use for this, like Prisma, do not run in the browser. However, even if it did, it would happily pass on whatever SQL-equivalent commands you give it, like `db.user.deleteMany()`, which would remove all user records! That kind of power in the hands of the client would wreck havoc the likes of which you have never seen.

Service functions can also call each other. For example, that theoretical Service function that handles transferring money between two accounts: it certainly comes in handy when a user initiates a transfer through a GraphQL call, but our business logic for what constitutes a transfer lives in that function. That function should be the only one responsible for moving money between two accounts, so we should make use of it anywhere we need to do a transfer—imagine an async task that moves $100 between a checking and savings account every 1st of the month.

```
┌───────────┐      ┌───────────┐
│  Service  │ ───> │  Service  │
└───────────┘      └───────────┘
```

Finally, Services can also be called from [serverless functions](serverless-functions.md). Confusingly, these are also called "functions", but are meant to be run in a serverless environment where the code only exists long enough to complete a task and is then shut down. Redwood loves serverless functions. In fact, your GraphQL endpoint is, itself, a serverless function! In Redwood, these go in `api/src/functions`. Serverless functions can make use of Services, rather than duplicating business logic inside of themselves. In our bank transfer example, a third party service could initiate a webhook call to one of our serverless functions saying that Alice just got paid. Our (serverless) function can then call our (Service) function to make the transfer from the third party to Alice.

```
┌───────────────────────┐      ┌───────────┐
│  Serverless Function  │ ───> │  Service  │
└───────────────────────┘      └───────────┘
```

## Service Validations

Starting with `v0.38`, Redwood includes a feature we call Service Validations. These simplify an extremely common task: making sure that incoming data is formatted properly before continuing. These validations are meant to be included at the start of your Service function and will throw an error if conditions are not met:

```jsx
import { validate, validateWith, validateUniqueness } from '@redwoodjs/api'

export const createUser = async ({ input }) => {
  validate(input.firstName, 'First name', {
    presence: true,
    excludes: { in: ['Admin', 'Owner'], message: 'That name is reserved, sorry!' },
    length: { min: 2, max: 255 }
  })
  validateWith(() => {
    if (input.role === 'Manager' && !context.currentUser.roles.includes('admin')) {
      throw 'Only Admins can create new Managers'
    }
  })

  return validateUniqueness('user', { username: input.username }, (db) => {
    return db.user.create({ data: input })
  })
}
```

> **What's the difference between Service Validations and Validator Directives?**
>
> [Validator Directives](directives.md#validators) were added to Redwood in v0.37 and provide a way to validate whether data going through GraphQL is allowed based on the user that's currently requesting it (the user that is logged in). These directives control *access* to data, while Service Validators operate on a different level, outside of GraphQL, and make sure data is formatted properly before, most commonly, putting it into a database.
>
> You could use these in combination to, for example, prevent a client from accessing the email addresses of any users that aren't themselves (Validator Directives) while also verifying that when creating a user, an email address is present, formatted correctly, and unique (Service Validations).

### Displaying to the User

If you're using [Redwood's scaffolds](cli-commands.md#generate-scaffold) then you'll see requisite error messages when trying to save a form that runs into these validation errors automatically:

![image](https://user-images.githubusercontent.com/300/138919184-89eddd9e-8ee7-4956-b7ed-ba8daaa0f6ea.png)

Otherwise you'll need to use the `error` property that you can [destructure](https://www.apollographql.com/docs/react/data/mutations/#executing-a-mutation) from `useMutation()` and display an element containing the error message (Redwood's [form helpers](/docs/forms) will do some of the heavy lifting for you for displaying the error):

```jsx {13,21}
import { Form, FormError, Label, TextField, Submit } from '@redwoodjs/forms'
import { useMutation } from '@redwoodjs/web'

const CREATE_CONTACT = gql`
  mutation CreateContactMutation($input: ContactInput!) {
    createContact(input: $input) {
      id
    }
  }
`

const ContactPage = () => {
  const [create, { loading, error }] = useMutation(CREATE_CONTACT)

  const onSubmit = (data) => {
    create({ variables: { input: data }})
  }

  return (
    <Form onSubmit={onSubmit}>
      <FormError error={error}>
      <Label name="email">Email Address</Label>
      <TextField name="email" />
      <Submit disabled={loading}>Save</Submit>
    </Form>
  )
}
```

### Importing

You'll import the three functions below from `@redwoodjs/api`:

```jsx
import { validate, validateWith, validateUniqueness } from '@redwoodjs/api'
```

### validate()

This is the main function to call when you have a piece of data to validate. There are two forms of this function call, one with 2 arguments and one with 3. The first argument is always the variable to validate and the last argument is an object with all the validations you want to run against the first argument. The (optional) second argument is the name of the field to be used in a default error message if you do not provide a custom one:

```jsx
// Two argument form: validate(value, validations)
validate(input.email, { email: { message: 'Please provide a valid email address' } })

// Three argument form: validate(value, name, validations)
validate(input.email, 'Email Address', { email: true }
```

All validations provide a generic error message if you do not specify one yourself (great for quickly getting your app working). In the three argument version, you provide the "name" of the field (in this case `'Email Address'`) and that will be used in the error message:

```
Email Address must be formatted like an email address
```

Using the two argument version will use your custom error message in the validations object properties:

```
Please provide a valid email address
```

#### Multiple Validations

You can provide multiple validations in the last argument object, some with custom messages and some without. If you include only *some* custom messages, make sure to use the 3-argument version as the ones without custom messages will need a variable name to include their messages:

```jsx
validate(input.name, 'Name', {
  presence: true,
  exclusion: {
    in: ['Admin', 'Owner'],
    message: 'Sorry that name is reserved'
  },
  length: {
    min: 2,
    max: 255,
    message: 'Please provide a name at least two characters long, but no more than 255'
  },
  format: {
    pattern: /^[A-Za-z]+$/,
    message: 'Name can only contain letters'
  }
)
```

Note that the validations object properties often take two forms: a simple form without a custom message, and a nested object when you do need a custom message:

```jsx
{ email: true }
{ email: { message: 'Must provide an email' } }

{ exclusion: ['Admin', 'Owner'] }
{ exclusion: { in: ['Admin', 'Owner' ], message: 'That name is reserved' } }
```

This keeps the syntax as simple as possible when a custom message is not required. Details on the options for each validation are detailed below.

#### Absence

Requires that a field NOT be present, meaning it must be `null` or `undefined`.
Opposite of the [presence](#presence) validator.

```jsx
validate(input.value, 'Value', {
  absence: true
})
```

##### Options

* `allowEmptyString` will count an empty string as being absent (that is, `null`, `undefined` and `""` will pass this validation)

```jsx
validate(input.honeypot, 'Honeypot', {
  absence: { allowEmptyString: true }
})
```

* `message`: a message to be shown if the validation fails

```jsx
validate(input.value, {
  absence: { message: 'Value must be absent' }
})
```

#### Acceptance

Requires that the passed value be `true`, or within an array of allowed values that will be considered "true".

```jsx
validate(input.terms, 'Terms of Service', {
  acceptance: true
})
```

##### Options

* `in`: an array of values that, if any match, will pass the validation

```jsx
validate(input.terms, 'Terms of Service', {
  acceptance: { in: [true, 'true', 1, '1'] }
})
```

* `message`: a custom message if validation fails

```jsx
validate(input.terms, {
  acceptance: {  message: 'Please accept the Terms of Service' }
})
```

#### Email

Requires that the value be formatted like an email address by comparing against a regular expression. The regex is extremely lax: `/^[^@\s]+@[^.\s]+\.[^\s]+$/` This says that the value:

* Must start with one or more characters that aren't a whitespace or literal `@`
* Followed by a `@`
* Followed by one or more characters that aren't a whitespace or literal `.`
* Followed by a `.`
* Ending with one or more characters that aren't whitespace

Since the [official email regex](http://www.ex-parrot.com/~pdw/Mail-RFC822-Address.html) is around 6,300 characters long, we though this one was good enough. If you have a different, preferred email validation regular expression, use the [format](#format) validation.

```jsx
validate(input.email, 'Email', {
  email: true
})
```

##### Options

* `message`: a custom message if validation fails

```jsx
validate(input.email, {
  email: { message: 'Please provide a valid email address'
})
```

#### Exclusion

Requires that the given value *not* equal to any in a list of given values. Opposite of the [inclusion](#inclusion) validation.

```jsx
validate(input.name, 'Name', {
  exclusion: ['Admin', 'Owner']
})
```

##### Options

* `in`: the list of values that cannot be used

```jsx
validate(input.name, 'Name', {
  exclusion: { in: ['Admin', 'Owner'] }
})
```

* `message`: a custom error message if validation fails

```jsx
validate(input.name, {
  exclusion: {
    in: ['Admin', 'Owner'],
    message: 'That name is reserved, try another'
  }
})
```

#### Format

Requires that the value match a given regular expression.

```jsx
validate(input.usPhone, 'US Phone Number', {
  format: /^[0-9-]{10,12}$/
})
```

##### Options

* `pattern`: the regular expression to use

```jsx
validate(input.usPhone, 'US Phone Number', {
  format: { pattern: /^[0-9-]{10,12}$/ }
})
```

* `message`: a custom error message if validation fails


```jsx
validate(input.usPhone, {
  format: {
    pattern: /^[0-9-]{10,12}$/,
    message: 'Can only contain numbers and dashes'
  }
})
```

#### Inclusion

Requires that the given value *is* equal to one in a list of given values. Opposite of the [exclusion](#exclusion) validation.

```jsx
validate(input.role, 'Role', {
  inclusion: ['Guest', 'Member', 'Manager']
})
```

##### Options

* `in`: the list of values that can be used

```jsx
validate(input.role, 'Role', {
  inclusion: { in: ['Guest', 'Member', 'Manager']  }
})
```

* `message`: a custom error message if validation fails

```jsx
validate(input.role, 'Role', {
  inclusion: {
    in: ['Guest', 'Member', 'Manager'] ,
    message: 'Please select a proper role'
  }
})
```

#### Length

Requires that the value meet one or more of a number of string length validations.

```jsx
validate(input.answer, 'Answer', {
  length: { min: 6, max: 200 }
})
```

##### Options

* `min`: must be at least this number of characters long

```jsx
validate(input.name, 'Name', {
  length: { min: 2 }
})
```

* `max`: must be no more than this number of characters long

```jsx
validate(input.company, 'Company', {
  length: { max: 255 }
})
```

* `equal`: must be exactly this number of characters long

```jsx
validate(input.pin, 'PIN', {
  length: { equal: 4 }
})
```

* `between`: convenience syntax for defining min and max as an array

```jsx
validate(input.title, 'Title', {
  length: { between: [2, 255] }
})
```

* `message`: a custom message if validation fails. Can use length options as string interpolations in the message itself, including `name` which is the name of the field provided in the second argument

```jsx
validate(input.title, 'Title', {
  length: { min: 2, max: 255, message: '${name} must be between ${min} and ${max} characters' }
})
```

> Note that you cannot use backticks to define the string here—that would cause the value(s) to be interpolated immediately, and `min` and `max` are not actually available yet. This must be a plain string using single or double quotes, but using the `${}` interpolation syntax inside.

#### Numericality

The awesomely-named Numericality Validation requires that the value passed meet one or more criteria that are all number related.

```jsx
validate(input.year, 'Year', {
  numericality: { greaterThan: 1900, lessThanOrEqual: 2021 }
})
```

##### Options

* `integer`: the number must be an integer

```jsx
validate(input.age, 'Age', {
  numericality: { integer: true }
})
```

* `lessThan`: the number must be less than the given value

```jsx
validate(input.temp, 'Temperature', {
  numericality: { lessThan: 100 }
})
```

* `lessThanOrEqual`: the number must be less than or equal to the given value

```jsx
validate(input.temp, 'Temperature', {
  numericality: { lessThanOrEqual: 100 }
})
```

* `greaterThan`: the number must be greater than the given value

```jsx
validate(input.temp, 'Temperature', {
  numericality: { greaterThan: 32 }
})
```

* `greaterThanOrEqual`: the number must be greater than or equal to the given number

```jsx
validate(input.temp, 'Temperature', {
  numericality: { greaterThanOrEqual: 32 }
})
```

* `equal`: the number must be equal to the given number

```jsx
validate(input.guess, 'Guess', {
  numericality: { equal: 6 }
})
```

* `otherThan`: the number must not be equal to the given number

```jsx
validate(input.floor, 'Floor', {
  numericality: { otherThan: 13 }
})
```

* `even`: the number must be even

```jsx
validate(input.skip, 'Skip', {
  numericality: { even: true }
})
```

* `odd`: the number must be odd

```jsx
validate(input.zenGarden, 'Zen Garden', {
  numericality: { odd: true }
})
```

* `positive`: the number must be positive (greater than 0)

```jsx
validate(input.balance, 'Balance', {
  numericality: { positive: true }
})
```

* `negative`: the number must be negative (less than 0)

```jsx
validate(input.debt, 'Debt', {
  numericality: { negative: true }
})
```

* `message`: a custom message if validation fails. Some options can be used in string interpolation: `lessThan`, `lessThanOrEqual`, `greaterThan`, `greaterThanOrEqual`, `equal`, and `otherThan`

```jsx
validate(input.floor, {
  numericality: { otherThan: 13, 'You cannot go to floor ${otherThan}' }
})
```

> Note that you cannot use backticks to define the string here—that would cause the value(s) to be interpolated immediately. This must be a plain string using single or double quotes, but using the `${}` interpolation syntax inside.

#### Presence

Requires that a field be present, meaning it must not be `null` or `undefined`.
Opposite of the [absence](#absence) validator.

```jsx
validate(input.value, 'Value', {
  presence: true
})
```

##### Options

* `allowNull`: whether or not to allow `null` to be considered present (default is `false`)

```jsx
validate(input.value, 'Value', {
  presence: { allowNull: true }
})
// `null` passes
// `undefined` fails
// "" passes
```

* `allowUndefined`: whether or not to allow `undefined` to be considered present (default is `false`)

```jsx
validate(input.value, 'Value', {
  presence: { allowUndefined: true }
})
// `null` fails
// `undefined` passes
// "" passes
```

* `allowEmptyString`: whether or not to allow an empty string `""` to be considered present (default is `true`)

```jsx
validate(input.value, 'Value', {
  presence: { allowEmptyString: false }
})
// `null` fails
// `undefined` fails
// "" fails
```

* `message`: a message to be shown if the validation fails

```jsx
validate(input.lastName, {
  presence: { allowEmptyString: false, message: "Can't leave last name empty" }
})
```

### validateWith()

`validateWith()` is simply given a function to execute. This function should throw with a message if there is a problem, otherwise do nothing.

```jsx
validateWith(() => {
  if (input.name === 'Name') {
    throw "You'll have to be more creative than that"
  }
})

validateWith(() => {
  if (input.name === 'Name') {
    throw new Error("You'll have to be more creative than that")
  }
})
```

Either of these errors will be caught and re-thrown as a `ServiceValidationError` with your text as the `message` of the error (although technically you should always throw errors with `new Error()` like in the second example).

You could just write your own function and throw whatever you like, without using `validateWith()`. But, when accessing your Service function through GraphQL, that error would be swallowed and the user would simply see "Something went wrong" for security reasons: error messages could reveal source code or other sensitive information so most are hidden. Errors thrown by Service Validations are considered "safe" and allowed to be shown to the client.

### validateUniqueness()

This validation guarantees that the field(s) given in the first argument are unique in the database before executing the callback given in the last argument. If a record is found with the given fields then an error is thrown and the callback is not invoked.

> **Enable Prisma Preview Feature**
>
> Being able to use transactions with the syntax used internally by `validateUniqueness()` is experimental for Prisma as of v2.29.0. You'll need to enable it as a preview feature. In your `api/db/schema.prisma` file:
>
> ```text {4}
> generator client {
>   provider        = "prisma-client-js"
>   binaryTargets   = "native"
>   previewFeatures = ["interactiveTransactions"]
> }
> ```
>
> You'll need to regenerate the prisma client and restart your dev server for changes to take effect:
>
> ```bash
> yarn rw prisma generate
> yarn rw dev
>```

The uniqueness guarantee is handled through Prisma's [transaction API](https://www.prisma.io/docs/concepts/components/prisma-client/transactions). Given this example validation:

```jsx
return validateUniqueness('user', { username: input.username }, (db) => {
  return db.user.create({ data: input })
})
```

It is functionally equivalent to:

```jsx
return await db.$transaction(async (db) => {
  if (await db.user.findFirst({ username: input.username })) {
    throw new ServiceValidationError('Username is not unique')
  } else {
    return db.user.create({ data: input })
  }
})
```

So `validateUniqueness()` first tries to find a record with the given fields, and if found raise an error, if not then executes the callback.

> **Why use this when the database can verify uniqueness with a UNIQUE INDEX database constraint?**
>
> You may be in a situation where you can't have a unique index (supporting a legacy schema, perhaps), but still want to make sure the data is unique before proceeding. There is also the belief that you shouldn't have to count on the database to validate your data—that's a core concern of your business logic, and your business logic should live in your Services in a Redwood app.
> 
> Another issue is that the error raised by Prisma when a record validates a unique index is swallowed by GraphQL and so you can't report it to the user (there are still ways around this, but it involves catching and re-throwing a different error). The error raised by `validateUniqueness()` is already safe-listed and allowed to be sent to the browser. 

#### Arguments

1. The name of the db table accessor that will be checked (what you would call on `db` in a normal Prisma call). If you'd call `db.user` then this value is `"user"`.
2. An object, containing the db fields/values to check for uniqueness, like `{ email: 'rob@redwoodjs.com' }`. Can also include additional options explained below that provide for a narrower scope for uniqueness requirements, and a way for the record to identify itself and not create a false positive for an existing record.
3. [Optional] An object with options.
4. Callback to be invoked if record is found to be unique.

In its most basic usage, say you want to make sure that a user's email address is unique before creating the record. `input` is an object containing all the user fields to save to the database, including `email` which must be unique:

```jsx
const createUser = (input) => {
  return validateUniqueness('user', { email: input.email }, (db) => {
    return db.user.create({ data: input })
  })
}
```

You can provide a custom message if the validation failed with the optional third argument:

```jsx
const createUser = (input) => {
  return validateUniqueness('user',
    { email: input.email },
    { message: 'Your email is already in use' },
    (db) => db.user.create({ data: input })
  )
}
```

Be sure that both your callback and the surrounding `validateUniqueness()` function are `return`ed or else your service function will have nothing to return to its consumers, like GraphQL.

##### $self

What about updating an existing record? In its default usage, an update with this same `validateUniqueness` check will fail because the existing record will be found in the database and so think the email address is already in use, even though its in use by itself! In this case, pass an extra `$self` prop to the list of fields containing a check on how to identify the record as itself:

```jsx
const updateUser = (id, input) => {
  return validateUniqueness('user', {
    email: input.email,
    $self: { id }
  }, (db) => db.user.create({ data: input })
}
```

Now the check for whether a record exists will exclude those records whose `id` is the same as this record's `id`.

##### $scope

Sometimes we may only want to check uniqueness against a subset of records, say only those owned by the same user. Two different users can create the same blog post with the same title, but a single user can't create two posts with the same title. If the `Post` table contains a foreign key to the user that created it, called `userId`, we can use that to **scope** the uniqueness check:

```jsx
const createPost = (input) => {
  return validateUniqueness('post', {
    title: input.title,
    $scope: { userId: context.currentUser.id }
  }, (db) => {
    return db.user.create({ data: input })
  })
}
```

This makes sure that the user that's logged in and creating the post cannot reuse the same blog post title as one of their own posts.
