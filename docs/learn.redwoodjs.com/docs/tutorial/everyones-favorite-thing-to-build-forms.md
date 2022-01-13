---
id: everyones-favorite-thing-to-build-forms
title: "Everyone's Favorite Thing to Build: Forms"
sidebar_label: "Everyone's Favorite Thing to Build: Forms"
---

Wait, don't close your browser! You had to know this was coming eventually, didn't you? And you've probably realized by now we wouldn't even have this section in the tutorial unless Redwood had figured out a way to make forms less soul-sucking than usual. In fact Redwood might even make you _love_ building forms. Well, love is a strong word. _Like_ building forms? _Tolerate_ building them?

Part 3 of the video tutorial picks up here:

> **Ancient Content Notice**
>
> These videos were recorded with an earlier version of Redwood and many commands are now out-of-date. If you really want to build the blog app you'll need to follow along with the text which we keep up-to-date with the latest releases.

<div class="video-container">
  <iframe src="https://www.youtube.com/embed/eT7iIy0F8Tk?rel=0" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; modestbranding; showinfo=0" allowfullscreen></iframe>
</div>

We already have a form or two in our app; remember our posts scaffold? And those work pretty well! How hard can it be? (Hopefully you haven't sneaked a peek at that code—what's coming next will be much more impressive if you haven't.)

Let's build the simplest form that still makes sense for our blog, a "contact us" form.

### The Page

    yarn rw g page contact

We can put a link to Contact in our layout's header:

```javascript {17-19}
// web/src/layouts/BlogLayout/BlogLayout.js

import { Link, routes } from '@redwoodjs/router'

const BlogLayout = ({ children }) => {
  return (
    <>
      <header>
        <h1>
          <Link to={routes.home()}>Redwood Blog</Link>
        </h1>
        <nav>
          <ul>
            <li>
              <Link to={routes.about()}>About</Link>
            </li>
            <li>
              <Link to={routes.contact()}>Contact</Link>
            </li>
          </ul>
        </nav>
      </header>
      <main>{children}</main>
    </>
  )
}

export default BlogLayout
```

And then use the `BlogLayout` for the `ContactPage` by making sure its wrapped by the same `<Set>` as the other pages in the routes file:

```javascript {5}
// web/src/Routes.js

// ...

<Router>
  <Set wrap={BlogLayout}>
    <Route path="/blog-post/{id}" page={BlogPostPage} name="blogPost" />
    <Route path="/contact" page={ContactPage} name="contact" />
    <Route path="/about" page={AboutPage} name="about" />
    <Route path="/" page={HomePage} name="home" />
  </Set>
  <Route notfound page={NotFoundPage} />
</Router>
```

Double check that everything looks good and then let's get to the good stuff.

### Introducing Form Helpers

Forms in React are infamously annoying to work with. There are [Controlled Components](https://reactjs.org/docs/forms.html#controlled-components) and [Uncontrolled Components](https://reactjs.org/docs/uncontrolled-components.html) and [third party libraries](https://jaredpalmer.com/formik/) and many more workarounds to try and make forms in React as simple as they were originally intended to be in the HTML spec: an `<input>` field with a `name` attribute that gets submitted somewhere when you click a button.

We think Redwood is a step or two in the right direction by not only freeing you from writing controlled component plumbing, but also dealing with validation and errors automatically. Let's see how it works.

Before we start, let's add a couple of CSS classes to make the default form layout a little cleaner and save us from having to write a bunch of `style` attributes that will clutter up the examples and make them harder to follow. For now we'll just put these in the root `index.css` file in `web/src`:

```css
/* web/src/index.css */

button, input, label, textarea {
  display: block;
  outline: none;
}

label {
  margin-top: 1rem;
}

.error {
  color: red;
}

input.error, textarea.error {
  border: 1px solid red;
}
```

For now we won't be talking to the database in our Contact form so we won't create a cell. Let's create the form right on the page. Redwood forms start with the...wait for it...`<Form>` tag:

```javascript {3,7}
// web/src/pages/ContactPage/ContactPage.js

import { Form } from '@redwoodjs/forms'

const ContactPage = () => {
  return (
    <Form></Form>
  )
}

export default ContactPage
```

Well that was anticlimactic. You can't even see it in the browser. Let's add a form field so we can at least see something. Redwood ships with several inputs and a plain text input box is `<TextField>`. We'll also give the field a `name` attribute so that once there are multiple inputs on this page we'll know which contains which data:

```javascript {3,8}
// web/src/pages/ContactPage/ContactPage.js

import { Form, TextField } from '@redwoodjs/forms'

const ContactPage = () => {
  return (
    <Form>
      <TextField name="input" />
    </Form>
  )
}

export default ContactPage
```

<img src="https://user-images.githubusercontent.com/300/80258121-4f4d2300-8637-11ea-83f5-c667e05aaf74.png" />

Something is showing! Still, pretty boring. How about adding a submit button?

```javascript {3,9}
// web/src/pages/ContactPage/ContactPage.js

import { Form, TextField, Submit } from '@redwoodjs/forms'

const ContactPage = () => {
  return (
    <Form>
      <TextField name="input" />
      <Submit>Save</Submit>
    </Form>
  )
}

export default ContactPage
```

<img src="https://user-images.githubusercontent.com/300/80258188-7572c300-8637-11ea-9583-1b7636f93be0.png" />

We have what might actually be considered a real, bonafide form here. Try typing something in and clicking "Save". Nothing blew up on the page but we have no indication that the form submitted or what happened to the data (although you may have noticed an error in the Web Inspector). Next we'll get the data in our fields.

### onSubmit

Similar to a plain HTML form we'll give `<Form>` an `onSubmit` handler. That handler will be called with a single argument—an object containing all of the submitted form fields:

```javascript {4-6,9}
// web/src/pages/ContactPage/ContactPage.js

const ContactPage = () => {
  const onSubmit = (data) => {
    console.log(data)
  }

  return (
    <Form onSubmit={onSubmit}>
      <TextField name="input" />
      <Submit>Save</Submit>
    </Form>
  )
}
```

Now try filling in some data and submitting:

<img src="https://user-images.githubusercontent.com/300/80258293-c08cd600-8637-11ea-92fb-93d3ca1db3cf.png" />

Great! Let's turn this into a more useful form by adding a couple fields. We'll rename the existing one to "name" and add "email" and "message":

```javascript {3,12-14}
// web/src/pages/ContactPage/ContactPage.js

import { Form, TextField, TextAreaField, Submit } from '@redwoodjs/forms'

const ContactPage = () => {
  const onSubmit = (data) => {
    console.log(data)
  }

  return (
    <Form onSubmit={onSubmit}>
      <TextField name="name" />
      <TextField name="email" />
      <TextAreaField name="message" />
      <Submit>Save</Submit>
    </Form>
  )
}

export default ContactPage
```

See the new `<TextAreaField>` component here which generates an HTML `<textarea>` but that contains Redwood's form goodness:

<img src="https://user-images.githubusercontent.com/300/80258346-e4e8b280-8637-11ea-908b-06a1160b932b.png" />

Let's add some labels:

```javascript {5,8,11}
// web/src/pages/ContactPage/ContactPage.js

return (
  <Form onSubmit={onSubmit}>
    <label htmlFor="name">Name</label>
    <TextField name="name" />

    <label htmlFor="email">Email</label>
    <TextField name="email" />

    <label htmlFor="message">Message</label>
    <TextAreaField name="message" />

    <Submit>Save</Submit>
  </Form>
)
```

<img src="https://user-images.githubusercontent.com/300/80258431-15c8e780-8638-11ea-8eca-0bd222b51d8a.png" />

Try filling out the form and submitting and you should get a console message with all three fields now.

### Validation

"Okay, Redwood tutorial author," you're saying, "what's the big deal? You built up Redwood's form helpers as The Next Big Thing but there are plenty of libraries that will let me skip creating controlled inputs manually. So what?" And you're right! Anyone can fill out a form _correctly_ (although there are plenty of QA folks who would challenge that statement), but what happens when someone leaves something out, or makes a mistake, or tries to haxorz our form? Now who's going to be there to help? Redwood, that's who!

All three of these fields should be required in order for someone to send a message to us. Let's enforce that with the standard HTML `required` attribute:

```javascript {6,9,12}
// web/src/pages/ContactPage/ContactPage.js

return (
  <Form onSubmit={onSubmit}>
    <label htmlFor="name">Name</label>
    <TextField name="name" required />

    <label htmlFor="email">Email</label>
    <TextField name="email" required />

    <label htmlFor="message">Message</label>
    <TextAreaField name="message" required />

    <Submit>Save</Submit>
  </Form>
)
```

<img src="https://user-images.githubusercontent.com/300/80258542-5163b180-8638-11ea-8450-8a727de177ad.png" />

Now when trying to submit there'll be message from the browser noting that a field must be filled in. This is better than nothing, but these messages can't be styled. Can we do better?

Yes! Let's update that `required` call to instead be an object we pass to a custom attribute on Redwood form helpers called `validation`:

```javascript {6,9,12}
// web/src/pages/ContactPage/ContactPage.js

return (
  <Form onSubmit={onSubmit}>
    <label htmlFor="name">Name</label>
    <TextField name="name" validation={{ required: true }} />

    <label htmlFor="email">Email</label>
    <TextField name="email" validation={{ required: true }} />

    <label htmlFor="message">Message</label>
    <TextAreaField name="message" validation={{ required: true }} />

    <Submit>Save</Submit>
  </Form>
)
```

And now when we submit the form with blank fields...the Name field gets focus. Boring. But this is just a stepping stone to our amazing reveal! We have one more form helper component to add—the one that displays errors on a field. Oh, it just so happens that it's plain HTML so we can style it however we want!

### `<FieldError>`

Introducing `<FieldError>` (don't forget to include it in the `import` statement at the top):

```javascript {8,20,24,28}
// web/src/pages/ContactPage/ContactPage.js

import {
  Form,
  TextField,
  TextAreaField,
  Submit,
  FieldError,
} from '@redwoodjs/forms'

const ContactPage = () => {
  const onSubmit = (data) => {
    console.log(data)
  }

  return (
    <Form onSubmit={onSubmit}>
      <label htmlFor="name">Name</label>
      <TextField name="name" validation={{ required: true }} />
      <FieldError name="name" />

      <label htmlFor="email">Email</label>
      <TextField name="email" validation={{ required: true }} />
      <FieldError name="email" />

      <label htmlFor="message">Message</label>
      <TextAreaField name="message" validation={{ required: true }} />
      <FieldError name="message" />

      <Submit>Save</Submit>
    </Form>
  )
}

export default ContactPage
```

Note that the `name` attribute matches the `name` of the input field above it. That's so it knows which field to display errors for. Try submitting that form now.

<img src="https://user-images.githubusercontent.com/300/80258694-ac95a400-8638-11ea-904c-dc034f07b12a.png" />

But this is just the beginning. Let's make sure folks realize this is an error message. Remember the `.error` class we defined in `index.css`? Check out the `className` attribute on `<FieldError>`:

```javascript {7,11,15}
// web/src/pages/ContactPage/ContactPage.js

return (
  <Form onSubmit={onSubmit}>
    <label htmlFor="name">Name</label>
    <TextField name="name" validation={{ required: true }} />
    <FieldError name="name" className="error" />

    <label htmlFor="email">Email</label>
    <TextField name="email" validation={{ required: true }} />
    <FieldError name="email" className="error" />

    <label htmlFor="message">Message</label>
    <TextAreaField name="message" validation={{ required: true }} />
    <FieldError name="message" className="error" />

    <Submit>Save</Submit>
  </Form>
)
```

<img src="https://user-images.githubusercontent.com/300/73306040-3cf65100-41d0-11ea-99a9-9468bba82da7.png" />

You know what would be nice? If the input itself somehow displayed the fact that there was an error. Check out the `errorClassName` attributes on the inputs:

```javascript {9,17,25}
// web/src/pages/ContactPage/ContactPage.js

return (
  <Form onSubmit={onSubmit}>
    <label htmlFor="name">Name</label>
    <TextField
      name="name"
      validation={{ required: true }}
      errorClassName="error"
    />
    <FieldError name="name" className="error" />

    <label htmlFor="email">Email</label>
    <TextField
      name="email"
      validation={{ required: true }}
      errorClassName="error"
    />
    <FieldError name="email" className="error" />

    <label htmlFor="message">Message</label>
    <TextAreaField
      name="message"
      validation={{ required: true }}
      errorClassName="error"
    />
    <FieldError name="message" className="error" />

    <Submit>Save</Submit>
  </Form>
)
```

<img src="https://user-images.githubusercontent.com/300/80258907-39d8f880-8639-11ea-8816-03a11c69e8ac.png" />

Oooo, what if the _label_ could change as well? It can, but we'll need Redwood's custom `<Label>` component for that. Note that the `htmlFor` attribute of `<label>` becomes the `name` prop on `<Label>`, just like with the other Redwood form components. And don't forget the import:

```javascript {9,19-21,29-31,39-41}
// web/src/pages/ContactPage/ContactPage.js

import {
  Form,
  TextField,
  TextAreaField,
  Submit,
  FieldError,
  Label,
} from '@redwoodjs/forms'

const ContactPage = () => {
  const onSubmit = (data) => {
    console.log(data)
  }

  return (
    <Form onSubmit={onSubmit}>
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
        validation={{ required: true }}
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

      <Submit>Save</Submit>
    </Form>
  )
}

export default ContactPage
```

<img src="https://user-images.githubusercontent.com/300/80259003-70af0e80-8639-11ea-97cf-b6b816118fbf.png" />

> **Error styling**
>
> In addition to `className` and `errorClassName` you can also use `style` and `errorStyle`. Check out the [Form docs](https://redwoodjs.com/docs/form) for more details on error styling.

### Validating Input Format

We should make sure the email field actually contains an email:

```html {7-9}
// web/src/pages/ContactPage/ContactPage.js

<TextField
  name="email"
  validation={{
    required: true,
    pattern: {
      value: /[^@]+@[^.]+\..+/,
    },
  }}
  errorClassName="error"
/>
```

That is definitely not the end-all-be-all for email address validation, but pretend it's bulletproof. Let's also change the message on the email validation to be a little more friendly:

```html {9}
// web/src/pages/ContactPage/ContactPage.js

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
```

<img src="https://user-images.githubusercontent.com/300/80259139-bd92e500-8639-11ea-99d5-be278dc67afc.png" />

You may have noticed that trying to submit a form with validation errors outputs nothing to the console—it's not actually submitting. That's a good thing! Fix the errors and all is well.

> **Instant client-side field validation**
>
> When a validation error appears it will _disappear_ as soon as you fix the content of the field. You don't have to click "Submit" again to remove the error messages.

Finally, you know what would _really_ be nice? If the fields were validated as soon as the user leaves each one so they don't fill out the whole thing and submit just to see multiple errors appear. Let's do that:

```html
// web/src/pages/ContactPage/ContactPage.js

<Form onSubmit={onSubmit} config={{ mode: 'onBlur' }}>
```

Well, what do you think? Was it worth the hype? A couple of new components and you've got forms that handle validation and wrap up submitted values in a nice data object, all for free.

> **Learn more about Redwood Forms**
>
> Redwood's forms are built on top of [React Hook Form](https://react-hook-form.com/) so there is even more functionality available than we've documented here. Visit the [Form docs](https://redwoodjs.com/docs/form) to learn more about all form functionalities.

Redwood has one more trick up its sleeve when it comes to forms but we'll save that for when we're actually submitting one to the server.

Having a contact form is great, but only if you actually get the contact somehow. Let's create a database table to hold the submitted data and create our first GraphQL mutation.

