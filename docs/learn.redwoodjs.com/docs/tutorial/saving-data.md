---
id: saving-data
title: "Saving Data"
sidebar_label: "Saving Data"
---

Let's add a new database table. Open up `api/db/schema.prisma` and add a Contact model after the Post model that's there now:

```javascript
// api/db/schema.prisma

// ...

model Contact {
  id        Int @id @default(autoincrement())
  name      String
  email     String
  message   String
  createdAt DateTime @default(now())
}
```

> **Prisma syntax for optional fields**
>
> To mark a field as optional (that is, allowing `NULL` as a value) you can suffix the datatype with a question mark, e.g. `name String?`. This will allow `name`'s value to either a `String` or `NULL`.

Next we create and apply a migration:

    yarn rw prisma migrate dev

We can name this one something like "create contacts".

Now we'll create the GraphQL interface to access this table. We haven't used this `generate` command yet (although the `scaffold` command did use it behind the scenes):

    yarn rw g sdl contact

Just like the `scaffold` command, this will create two new files under the `api` directory:

1. `api/src/graphql/contacts.sdl.js`: defines the GraphQL schema in GraphQL's schema definition language
2. `api/src/services/contacts/contacts.js`: contains your app's business logic.

Open up `api/src/graphql/contacts.sdl.js` and you'll see the `Contact`, `CreateContactInput` and `UpdateContactInput` types were already defined for us—the `generate sdl` command introspected the schema and created a `Contact` type containing each database field in the table, as well as a `Query` type with a single query `contacts` which returns an array of `Contact` types.

The `@requireAuth` is a [schema directive](https://www.graphql-tools.com/docs/schema-directives) which says that in order to access this GraphQL query the user is required to be authenticated. We haven't added authentication yet, so this won't have any effect—anyone will be able to query it, logged in or not:

```javascript
// api/src/graphql/contacts.sdl.js

export const schema = gql`
  type Contact {
    id: Int!
    name: String!
    email: String!
    message: String!
    createdAt: DateTime!
  }

  type Query {
    contacts: [Contact!]! @requireAuth
  }

  input CreateContactInput {
    name: String!
    email: String!
    message: String!
  }

  input UpdateContactInput {
    name: String
    email: String
    message: String
  }
`
```

What's `CreateContactInput` and `UpdateContactInput`? Redwood follows the GraphQL recommendation of using [Input Types](https://graphql.org/graphql-js/mutations-and-input-types/) in mutations rather than listing out each and every field that can be set. Any fields required in `schema.prisma` are also required in `CreateContactInput` (you can't create a valid record without them) but nothing is explicitly required in `UpdateContactInput`. This is because you could want to update only a single field, or two fields, or all fields. The alternative would be to create separate Input types for every permutation of fields you would want to update. We felt that only having one update input, while maybe not pedantically the absolute **correct** way to create a GraphQL API, was a good compromise for optimal developer experience.

> Redwood assumes your code won't try to set a value on any field named `id` or `createdAt` so it left those out of the Input types, but if your database allowed either of those to be set manually you can update `CreateContactInput` or `UpdateContactInput` and add them.

Since all of the DB columns were required in the `schema.prisma` file they are marked as required in the GraphQL Types with the `!` suffix on the datatype (e.g. `name: String!`).
).

> **GraphQL syntax for required fields**
>
> GraphQL's SDL syntax requires an extra `!` when a field _is_ required. Remember: `schema.prisma` syntax requires an extra `?` character when a field is _not_ required.

As described in [Side Quest: How Redwood Deals with Data](side-quest-how-redwood-works-with-data), there are no explicit resolvers defined in the SDL file. Redwood follows a simple naming convention: each field listed in the `Query` and `Mutation` types in the `sdl` file (`api/src/graphql/contacts.sdl.js`) maps to a function with the same name in the `services` file (`api/src/services/contacts/contacts.js`).

In this case we're creating a single `Mutation` that we'll call `createContact`. Add that to the end of the SDL file (before the closing backtick):

```javascript {28-30}
// api/src/graphql/contacts.sdl.js

export const schema = gql`
  type Contact {
    id: Int!
    name: String!
    email: String!
    message: String!
    createdAt: DateTime!
  }

  type Query {
    contacts: [Contact!]! @requireAuth
  }

  input CreateContactInput {
    name: String!
    email: String!
    message: String!
  }

  input UpdateContactInput {
    name: String
    email: String
    message: String
  }

  type Mutation {
    createContact(input: CreateContactInput!): Contact @skipAuth
  }
`
```

The `createContact` mutation will accept a single variable, `input`, that is an object that conforms to what we expect for a `CreateContactInput`, namely `{ name, email, message }`. We've also added on a new directive: `@skipAuth`. This one says that authentication is *not* required and will allow anyone to anonymously send us a message, which is exactly what we want! Note that having at least one schema directive is required for each `Query` and `Mutation` or you'll get an error: Redwood embraces the idea of "secure by default" meaning that we try and keep your application safe, even if you do nothing special to prevent access. In this case it's much safer to throw an error than to accidentally expose all of your users' data to the internet!

> Serendipitously, the default schema directive of `@requireAuth` is exactly what we want for the `contacts` query that returns ALL contacts—only we, the owners of the blog, should have access to read them all.

That's it for the SDL file, let's define the service that will actually save the data to the database. The service includes a default `contacts` function for getting all contacts from the database. Let's add our mutation to create a new contact:

```javascript {9-11}
// api/src/services/contacts/contacts.js

import { db } from 'src/lib/db'

export const contacts = () => {
  return db.contact.findMany()
}

export const createContact = ({ input }) => {
  return db.contact.create({ data: input })
}
```

Thanks to Prisma it takes very little code to actually save something to the database! This is an asynchronous call but we didn't have to worry about resolving Promises or dealing with `async/await`. Apollo will do that for us!

Before we plug this into the UI, let's take a look at a nifty GUI you get just by running `yarn redwood dev`.

### GraphQL Playground

Often it's nice to experiment and call your API in a more "raw" form before you get too far down the path of implementation only to find out something is missing. Is there a typo in the API layer or the web layer? Let's find out by accessing just the API layer.

When you started development with `yarn redwood dev` you actually started a second process running at the same time. Open a new browser tab and head to http://localhost:8911/graphql This is Apollo Server's [GraphQL Playground](https://www.apollographql.com/docs/apollo-server/testing/graphql-playground/), a web-based GUI for GraphQL APIs:

<img src="https://user-images.githubusercontent.com/300/70950852-9b97af00-2016-11ea-9550-b6983ce664e2.png" />

Not very exciting yet, but check out that "Docs" tab on the far right:

<img src="https://user-images.githubusercontent.com/300/73311311-fce89b80-41da-11ea-9a7f-2ef6b8191052.png" />

It's the complete schema as defined by our SDL files! The Playground will ingest these definitions and give you autocomplete hints on the left to help you build queries from scratch. Try getting the IDs of all the posts in the database; type the query at the left and then click the "Play" button to execute:

<img src="https://user-images.githubusercontent.com/300/70951466-52e0f580-2018-11ea-91d6-5a5712858781.png" />

The GraphQL Playground is a great way to experiment with your API or troubleshoot when you come across a query or mutation that isn't behaving in the way you expect.

### Creating a Contact

Our GraphQL mutation is ready to go on the backend so all that's left is to invoke it on the frontend. Everything related to our form is in `ContactPage` so that's the logical place to put the mutation call. First we define the mutation as a constant that we call later (this can be defined outside of the component itself, right after the `import` statements):

```javascript
// web/src/pages/ContactPage/ContactPage.js

const CREATE_CONTACT = gql`
  mutation CreateContactMutation($input: CreateContactInput!) {
    createContact(input: $input) {
      id
    }
  }
`
// ...
```

We reference the `createContact` mutation we defined in the Contacts SDL passing it an `input` object which will contain the actual name, email and message fields.

Next we'll call the `useMutation` hook provided by Apollo which will allow us to execute the mutation when we're ready (don't forget the `import` statement):

```javascript {11,14}
// web/src/pages/ContactPage/ContactPage.js

import {
  Form,
  TextField,
  TextAreaField,
  Submit,
  FieldError,
  Label,
} from '@redwoodjs/forms'
import { useMutation } from '@redwoodjs/web'

// ...

const ContactPage = () => {
  const [create] = useMutation(CREATE_CONTACT)

  const onSubmit = (data) => {
    console.log(data)
  }

  return (...)
}

// ...
```

`create` is a function that invokes the mutation and takes an object with a `variables` key, containing another object with an `input` key. As an example, we could call it like:

```javascript
create({
  variables: {
    input: {
      name: 'Rob',
      email: 'rob@redwoodjs.com',
      message: 'I love Redwood!',
    },
  },
})
```

If you'll recall `<Form>` gives us all of the fields in a nice object where the key is the name of the field, which means the `data` object we're receiving in `onSubmit` is already in the proper format that we need for the `input`!

Now we can update the `onSubmit` function to invoke the mutation with the data it receives:

```javascript {7}
// web/src/pages/ContactPage/ContactPage.js

// ...

const ContactPage = () => {
  const [create] = useMutation(CREATE_CONTACT)

  const onSubmit = (data) => {
    create({ variables: { input: data }})
    console.log(data)
  }

  return (...)
}

// ...
```

Try filling out the form and submitting—you should have a new Contact in the database! You can verify that with the GraphQL Playground if you were so inclined:

![image](https://user-images.githubusercontent.com/300/76250632-ed5d6900-6202-11ea-94ce-bd88e3a11ade.png)

> **Wait, I thought you said this was secure by default and someone couldn't view all contacts without being logged in?**
>
> Remember: we haven't added authentication yet, so the concept of someone being logged in is meaningless right now. In order to prevent frustrating errors in a new application, the `@requireAuth` directive simply returns `true` until you setup an authentication system. At that point the directive will use real logic for determining if the user is logged in or not and behave accordingly.

### Improving the Contact Form

Our contact form works but it has a couple of issues at the moment:

- Clicking the submit button multiple times will result in multiple submits
- The user has no idea if their submission was successful
- If an error was to occur on the server, we have no way of notifying the user

Let's address these issues.

The `useMutation` hook returns a couple more elements along with the function to invoke it. We can destructure these as the second element in the array that's returned. The two we care about are `loading` and `error`:

```javascript {6}
// web/src/pages/ContactPage/ContactPage.js

// ...

const ContactPage = () => {
  const [create, { loading, error }] = useMutation(CREATE_CONTACT)

  const onSubmit = (data) => {
    create({ variables: { input: data } })
    console.log(data)
  }

  return (...)
}

// ...
```

Now we know if the database call is still in progress by looking at `loading`. An easy fix for our multiple submit issue would be to disable the submit button if the response is still in progress. We can set the `disabled` attribute on the "Save" button to the value of `loading`:

```javascript {5}
// web/src/pages/ContactPage/ContactPage.js

return (
  // ...
  <Submit disabled={loading}>Save</Submit>
  // ...
)
```

It may be hard to see a difference in development because the submit is so fast, but you could enable network throttling via the Network tab Chrome's Web Inspector to simulate a slow connection:

<img src="https://user-images.githubusercontent.com/300/71037869-6dc56f80-20d5-11ea-8b26-3dadb8a1ed86.png" />

You'll see that the "Save" button become disabled for a second or two while waiting for the response.

Next, let's show a notification to let the user know their submission was successful. Redwood includes [react-hot-toast](https://react-hot-toast.com/) to quickly show a popup notification on a page.

`useMutation` accepts an options object as a second argument. One of the options is a callback function, `onCompleted`, that will be invoked when the mutation successfully completes. We'll use that callback to invoke a `toast()` function which will add a message to be displayed in a **&lt;Toaster&gt;** component.

Add the `onCompleted` callback to `useMutation` and include the **&lt;Toaster&gt;** component in our `return`, just before the **&lt;Form&gt;**. We also need to wrap it all in a fragment (&lt;&gt;&lt;/&gt;) because we are only allowed to return a single element:

```javascript {5,10-14,19,20,23}
// web/src/pages/ContactPage/ContactPage.js

// ...
import { useMutation } from '@redwoodjs/web'
import { toast, Toaster } from '@redwoodjs/web/toast'

// ...

const ContactPage = () => {
  const [create, { loading, error }] = useMutation(CREATE_CONTACT, {
    onCompleted: () => {
      toast.success('Thank you for your submission!')
    },
  })

  // ...

  return (
    <>
      <Toaster />
      <Form onSubmit={onSubmit} config={{ mode: 'onBlur' }}>
      // ...
    </>
  )
```

You can read the full documentation for Toast [here](https://redwoodjs.com/docs/toast-notifications).

### Displaying Server Errors

Next we'll inform the user of any server errors. So far we've only notified the user of _client_ errors: a field was missing or formatted incorrectly. But if we have server-side constraints in place `<Form>` can't know about those, but we still need to let the user know something went wrong.

We have email validation on the client, but any good developer knows [_never trust the client_](https://www.codebyamir.com/blog/never-trust-data-from-the-browser). Let's add the email validation on the API as well to be sure no bad data gets into our database, even if someone somehow bypassed our client-side validation.

> **No server-side validation?**
>
> Why don't we need server-side validation for the existence of name, email and message? Because the database is doing that for us. Remember the `String!` in our SDL definition? That adds a constraint in the database that the field cannot be `null`. If a `null` was to get all the way down to the database it would reject the insert/update and GraphQL would throw an error back to us on the client.
>
> There's no `Email!` datatype so we'll need to validate that on our own.

We talked about business logic belonging in our services files and this is a perfect example. Let's add a `validate` function to our `contacts` service:

```javascript {3,7-15,22}
// api/src/services/contacts/contacts.js

import { UserInputError } from '@redwoodjs/graphql-server'

import { db } from 'src/lib/db'

const validate = (input) => {
  if (input.email && !input.email.match(/[^@]+@[^.]+\..+/)) {
    throw new UserInputError("Can't create new contact", {
      messages: {
        email: ['is not formatted like an email address'],
      },
    })
  }
}

export const contacts = () => {
  return db.contact.findMany()
}

export const createContact = ({ input }) => {
  validate(input)
  return db.contact.create({ data: input })
}
```

So when `createContact` is called it will first validate the inputs and only if no errors are thrown will it continue to actually create the record in the database.

We already capture any existing error in the `error` constant that we got from `useMutation`, so we _could_ manually display an error box on the page somewhere containing those errors, maybe at the top of the form:

```html {4-9}
// web/src/pages/ContactPage/ContactPage.js

<Form onSubmit={onSubmit} config={{ mode: 'onBlur' }}>
  {error && (
    <div style={{ color: 'red' }}>
      {"We couldn't send your message: "}
      {error.message}
    </div>
  )}
  // ...
```

> If you need to handle your errors manually, you can do this:
>
> ```javascript {3-8}
> // web/src/pages/ContactPage/ContactPage.js
> const onSubmit = async (data) => {
>   try {
>     await create({ variables: { input: data } })
>     console.log(data)
>   } catch (error) {
>     console.log(error)
>   }
> }
> ```

To get a server error to fire, let's remove the email format validation so that the client-side error isn't shown:

```html
// web/src/pages/ContactPage/ContactPage.js

<TextField
  name="email"
  validation={{
    required: true,
  }}
  errorClassName="error"
/>
```

Now try filling out the form with an invalid email address:

<img src="https://user-images.githubusercontent.com/16427929/98918425-e394af80-24cd-11eb-9056-58c295cf0d5c.PNG" />

It ain't pretty, but it works. It would be nice if the field itself was highlighted like it was when the inline validation was in place...

Remember when we said that `<Form>` had one more trick up its sleeve? Here it comes!

Remove the inline error display we just added (`{ error && ...}`) and replace it with `<FormError>`, passing the `error` constant we got from `useMutation` and a little bit of styling to `wrapperStyle` (don't forget the `import`). We'll also pass `error` to `<Form>` so it can setup a context:

```javascript {10,20-24}
// web/src/pages/ContactPage/ContactPage.js

import {
  Form,
  TextField,
  TextAreaField,
  Submit,
  FieldError,
  Label,
  FormError,
} from '@redwoodjs/forms'
import { useMutation } from '@redwoodjs/web'
import { toast, Toaster } from '@redwoodjs/web/toast'

// ...

return (
  <>
    <Toaster />
    <Form onSubmit={onSubmit} config={{ mode: 'onBlur' }} error={error}>
      <FormError
        error={error}
        wrapperStyle={{ color: 'red', backgroundColor: 'lavenderblush' }}
      />

      //...
)
```

Now submit a message with an invalid email address:

<img src="https://user-images.githubusercontent.com/300/80259553-c46e2780-863a-11ea-9441-54a9112b9ce5.png" />

We get that error message at the top saying something went wrong in plain English _and_ the actual field is highlighted for us, just like the inline validation! The message at the top may be overkill for such a short form, but it can be key if a form is multiple screens long; the user gets a summary of what went wrong all in one place and they don't have to resort to hunting through a long form looking for red boxes. You don't have to use that message box at the top, though; just remove `<FormError>` and the field will still be highlighted as expected.

> **`<FormError>` styling options**
>
> `<FormError>` has several styling options which are attached to different parts of the message:
>
> - `wrapperStyle` / `wrapperClassName`: the container for the entire message
> - `titleStyle` / `titleClassName`: the "Can't create new contact" title
> - `listStyle` / `listClassName`: the `<ul>` that contains the list of errors
> - `listItemStyle` / `listItemClassName`: each individual `<li>` around each error

### One more thing...

Since we're not redirecting after the form submits we should at least clear out the form fields. This requires we get access to a `reset()` function that's part of [React Hook Form](https://react-hook-form.com/), but we don't have access to it when using the simplest usage of `<Form>` (like we're currently using).

Redwood includes a hook called `useForm()` (from React Hook Form) which is normally called for us within `<Form>`. In order to reset the form we need to invoke that hook ourselves. But the functionality that `useForm()` provides still needs to be used in `Form`. Here's how we do that.

First we'll import `useForm`:

```javascript
// web/src/pages/ContactPage/ContactPage.js

import { useForm } from '@redwoodjs/forms'
```

And now call it inside of our component:

```javascript {4}
// web/src/pages/ContactPage/ContactPage.js

const ContactPage = () => {
  const formMethods = useForm()
  //...
```

Finally we'll tell `<Form>` to use the `formMethods` we just got from `useForm()` instead of doing it itself:

```javascript {10}
// web/src/pages/ContactPage/ContactPage.js

return (
  <>
    <Toaster />
    <Form
      onSubmit={onSubmit}
      config={{ mode: 'onBlur' }}
      error={error}
      formMethods={formMethods}
    >
    // ...
```

Now we can call `reset()` on `formMethods` after we call `toast()`:

```javascript {6}
// web/src/pages/ContactPage/ContactPage.js

// ...

const [create, { loading, error }] = useMutation(CREATE_CONTACT, {
  onCompleted: () => {
    toast.success('Thank you for your submission!')
    formMethods.reset()
  },
})

// ...
```

<img alt="Screenshot of Contact form with toast success message" src="https://user-images.githubusercontent.com/300/112360362-7a008b00-8c8f-11eb-8649-76d00be920b7.png"/>

> You can put the email validation back into the `<TextField>` now, but you should leave the server validation in place, just in case.

Here's the final `ContactPage.js` page:

```javascript
import {
  Form,
  TextField,
  TextAreaField,
  Submit,
  FieldError,
  Label,
  FormError,
} from '@redwoodjs/forms'
import { useMutation } from '@redwoodjs/web'
import { toast, Toaster } from '@redwoodjs/web/toast'
import { useForm } from '@redwoodjs/forms'

const CREATE_CONTACT = gql`
  mutation CreateContactMutation($input: CreateContactInput!) {
    createContact(input: $input) {
      id
    }
  }
`

const ContactPage = () => {
  const formMethods = useForm()

  const [create, { loading, error }] = useMutation(CREATE_CONTACT, {
    onCompleted: () => {
      toast.success('Thank you for your submission!')
      formMethods.reset()
    },
  })

  const onSubmit = (data) => {
    create({ variables: { input: data } })
    console.log(data)
  }

  return (
    <>
      <Toaster />
      <Form
        onSubmit={onSubmit}
        config={{ mode: 'onBlur' }}
        error={error}
        formMethods={formMethods}
      >
        <FormError
          error={error}
          wrapperStyle={{ color: 'red', backgroundColor: 'lavenderblush' }}
        />
        <Label name="name" errorClassName="error">
          Name
        </Label>
        <TextField
          name="name"
          validation={{ required: true }}
          errorClassName="error"
        />
        <FieldError name="name" className="error" />

        <Label name="email" errorClassName="error">
          Email
        </Label>
        <TextField
          name="email"
          validation={{
            required: true,
            pattern: {
              value: /[^@]+@[^.]+\..+/,
              message: 'Please enter a valid email address',
            },
          }}
          errorClassName="error"
        />
        <FieldError name="email" className="error" />

        <Label name="message" errorClassName="error">
          Message
        </Label>
        <TextAreaField
          name="message"
          validation={{ required: true }}
          errorClassName="error"
        />
        <FieldError name="message" className="error" />

        <Submit disabled={loading}>Save</Submit>
      </Form>
    </>
  )
}

export default ContactPage
```

That's it! [React Hook Form](https://react-hook-form.com/) provides a bunch of [functionality](https://react-hook-form.com/api) that `<Form>` doesn't expose. When you want to get to that functionality you can: just call `useForm()` yourself but make sure to pass the returned object (we called it `formMethods`) as a prop to `<Form>` so that the validation and other functionality keeps working.

> You may have noticed that the onBlur form config stopped working once you started calling `useForm()` yourself. That's because Redwood calls `useForm()` behind the scenes and automatically passes it the `config` prop that you gave to `<Form>`. Redwood is no longer calling `useForm()` for you so if you need some options passed you need to do it manually:
>
> ```javascript
> // web/src/pages/ContactPage/ContactPage.js
>
> const ContactPage = () => {
>  const formMethods = useForm({ mode: 'onBlur' })
>   //...
> ```

The public site is looking pretty good. How about the administrative features that let us create and edit posts? We should move them to some kind of admin section and put them behind a login so that random users poking around at URLs can't create ads for discount pharmaceuticals.
