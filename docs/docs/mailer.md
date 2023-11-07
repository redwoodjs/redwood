# Mailer

RedwoodJS provides a convenient-to-use mailer that you can reach for when you need to start sending emails to your users.

## Architecture

The RedwoodJS mailer is comprised of handlers and renderers which each perform the core functionality of sending your emails out into the world and rendering your emails respectively. This is combined with just a few required files which define the necessary configuration.

### Renderers

A 'renderer' is responsible for taking your react components and rendering them into strings of text or HTML that can be sent as an email.

Redwood currently maintains and provides the following renderers:
* [@redwoodjs/mailer-renderer-react-email](https://github.com/redwoodjs/redwood/tree/main/packages/mailer/renderers/react-email) which is based on [https://react.email/](https://react.email/)
* [@redwoodjs/mailer-renderer-mjml-react](https://github.com/redwoodjs/redwood/tree/main/packages/mailer/renderers/mjml-react) which is based on [mjml-react](https://github.com/Faire/mjml-react)

You can also find community-maintained renderers by searching across npm, our forums, and our other community spaces.

> Email clients are notoriously inconsistent in how they each render HTML into the visual email content. It is important to consider using a good react library to help you write components that will produce good-looking emails that will be rendered consistently between email clients.

### Handlers

A 'handler' is the element responsible for taking your rendered content and passing it on to a service that can send your email to the intended recipients, e.g. nodemailer or Amazon SES.

Redwood currently maintains and provides the following handlers:
* [@redwoodjs/mailer-handler-in-memory](https://github.com/redwoodjs/redwood/tree/main/packages/mailer/handlers/in-memory) which is a simple in-memory handler typically used for testing
* [@redwoodjs/mailer-handler-nodemailer](https://github.com/redwoodjs/redwood/tree/main/packages/mailer/handlers/nodemailer) which allows you to use [nodemailer](https://nodemailer.com/)
* [@redwoodjs/mailer-handler-studio](https://github.com/redwoodjs/redwood/tree/main/packages/mailer/handlers/studio) which sends emails to the RedwoodJS Studio using nodemailer internally
* [@redwoodjs/mailer-handler-resend](https://github.com/redwoodjs/redwood/tree/main/packages/mailer/handlers/resend) which allows you to use [Resend](https://resend.com/)

Again, you can also find community-maintained handlers by searching across npm, our forums, and our other community spaces.

### Files & Directories

The central file around which the mailer functions is the `api/src/lib/mailer.ts` file. This contains configuration defining which handlers and renderers to use and how or when to use them. This file starts out looking like this:
```ts
import { Mailer } from '@redwoodjs/mailer-core'
import { NodemailerMailHandler } from '@redwoodjs/mailer-handler-nodemailer'
import { ReactEmailRenderer } from '@redwoodjs/mailer-renderer-react-email'

import { logger } from 'src/lib/logger'

export const mailer = new Mailer({
  handling: {
    handlers: {
      // TODO: Update this handler config or switch it out for a different handler completely
      nodemailer: new NodemailerMailHandler({
        transport: {
          host: 'localhost',
          port: 4319,
          secure: false,
        },
      }),
    },
    default: 'nodemailer',
  },

  rendering: {
    renderers: {
      reactEmail: new ReactEmailRenderer(),
    },
    default: 'reactEmail',
  },

  logger,
})
```
In the above you can see how handlers and renderers are defined. Handlers are defined in the `handling` object where the keys are any name you wish to give and the values are instances of the handler you want to use. Similarly for renderers which are defined in the `rendering` object. Each must have a `default` provided which specifies which option to use by default in production.

Redwood also expects you to locate your mail react components inside the `api/src/mail` directory. For example, if you had a welcome email it should be found in `api/src/mail/Welcome/Welcome.tsx`.

## Setup

The mailer is not set up by default when you create a new Redwood app but it is super simple to do so. Simply run the following CLI command:
```
yarn rw setup mailer
```
This command will setup the necessary files and include the necessary dependencies as detailed above. You can find more information on this command at [this](https://redwoodjs.com/docs/cli-commands#setup-mailer) specific section of our docs.

## Usage

### Example
The easiest way to understand using the mailer is with an example, so let's build one. In the tutorial, we built out a blog site. Let's say we have added a contact us functionality and the contact us form takes in a name, email, and message and stores it in the database. For this example let's assume we want to also send an email to some internal inbox with this contact us submission. The service would be updated like so:

```ts
import { mailer } from 'src/lib/mailer'
import { ContactUsEmail } from 'src/mail/Example/Example'

// ...

export const createContact: MutationResolvers['createContact'] = async ({
  input,
}) => {
  const contact = await db.contact.create({
    data: input,
  })

  // Send email
  await mailer.send(
    ContactUsEmail({
      name: input.name,
      email: input.email,
      // Note the date is hardcoded here for the sake of test snapshot consistency
      when: new Date(0).toLocaleString(),
    }),
    {
      to: 'inbox@example.com',
      subject: 'New Contact Us Submission',
      replyTo: input.email,
      from: 'contact-us@example.com',
    }
  )

  return contact
}
```
You can see in the code above we do the following:
* Import the mailer and our mail template
* Call the `mailer.send` function with:
  * Our template which we pass props into based on the user input
  * A set of send options to specify to, from, etc.

In the example above we specified a `replyTo` because that suited our business logic but we probably don't want to have to write `replyTo: 'no-reply@example.com'` in all our other emails where we might want that to be set. In that case, we can make use of the `defaults` property in our `api/src/lib/mailer.ts` config:

```ts
defaults: {
  replyTo: 'no-reply@example.com',
},
```

Now that we implemented our example we might start to think about testing or how to try this out ourselves during development. To help with this the mailer behaves slightly differently based on which environment you are running in. This helps make your experience better as you don't have to worry about sending real emails during testing or development. A high-level overview of this behavior is shown in the diagram below and we'll cover each case in more detail below the diagram.
<img alt="mailer-flow" src="/img/mailer/flow.svg" />

### Testing

When your `NODE_ENV` is set to `test` then the mailer will start in test mode. In this mode, all mail will be sent using a test handler rather than the default production one or any specific one set when calling `send` or `sendWithoutRendering`.

By default when the mailer is created it will check if the `@redwoodjs/mailer-handler-in-memory` package is available. If it is then this will become the test handler otherwise the test handler will just be a no-op which does nothing. The `yarn rw setup mailer` command adds this `@redwoodjs/mailer-handler-in-memory` package as a `devDependency` automatically for you.

If you want control over this test mode behavior then you can include the following configuration in the `mailer.ts` file:
```ts
test: {
  when: process.env.NODE_ENV === 'test',
  handler: 'someOtherHandler',
}
```
The `when` property can either be a boolean or a function that returns a boolean. This is what decides if the mailer starts in test mode when it is created. The `handler` property can be used to specify a different handler to use in test mode.

As an example of how this helps with testing, let us work off the example we created above. Let us now test our email functionality in the corresponding test file:
```ts
describe('contacts', () => {
  scenario('creates a contact', async () => {
    const result = await createContact({
      input: { name: 'String', email: 'String', message: 'String' },
    })

    expect(result.name).toEqual('String')
    expect(result.email).toEqual('String')
    expect(result.message).toEqual('String')

    // Mail
    const testHandler = mailer.getTestHandler() as InMemoryMailHandler
    expect(testHandler.inbox.length).toBe(1)
    const sentMail = testHandler.inbox[0]
    expect({
      ...sentMail,
      htmlContent: undefined,
      textContent: undefined,
    }).toMatchInlineSnapshot(`
      {
        "attachments": [],
        "bcc": [],
        "cc": [],
        "from": "contact-us@example.com",
        "handler": "nodemailer",
        "handlerOptions": undefined,
        "headers": {},
        "htmlContent": undefined,
        "renderer": "reactEmail",
        "rendererOptions": {},
        "replyTo": "String",
        "subject": "New Contact Us Submission",
        "textContent": undefined,
        "to": [
          "inbox@example.com",
        ],
      }
    `)
    expect(sentMail.htmlContent).toMatchSnapshot()
    expect(sentMail.textContent).toMatchSnapshot()
  })
})
```
Above we tested that our service did the following:
* Sent one email
* All the send options (such as to, from, what handler, etc.) match a set of expected values (the inline snapshot)
* That the rendered text and html content match the expected value (the snapshots)

### Development

Similar to the test mode the mailer also has a development mode. This mode is selected automatically when the mailer is created if `NODE_ENV` is **not** set to `production`. This mode behaves similarly to the test mode and by default will attempt to use the `@redwoodjs/mailer-handler-studio` package if it is available.

You can similarly control the development mode behavior with the following configuration in the `mailer.ts` file:
```ts
development: {
  when: process.env.NODE_ENV !== 'production',
  handler: 'someOtherHandler',
},
```

> The Redwood studio has some helpful features when it comes to using the mailer during development. It can provide a mail inbox so that you can send mail to your local machine and see the results. It can also provide live previews of your rendered mail templates as a guide to what they will likely look like when sent to your end users.

### Production

If neither the test nor development mode conditions are met the mailer will start in production mode. In this mode, there is no rerouting of your mail to different handlers. Instead, your mail will go directly to your default handler unless you specifically state a different one in your send options.

## Extension

You may find we do not provide a handler or renderer for the service or technology you wish to use. This does not prevent you from using the mailer. Instead, you can use this opportunity to create your own handler or renderer which you can then open source to the wider redwood community.

To do this you can read over the existing implementations for handlers [here](https://github.com/redwoodjs/redwood/tree/main/packages/mailer/handlers) and renderers [here](https://github.com/redwoodjs/redwood/tree/main/packages/mailer/renderers). You can also find the interfaces that can handler or mailer must satisfy [here](https://github.com/redwoodjs/redwood/tree/main/packages/mailer/core) in the `@redwoodjs/mailer-core` package.

Be sure to check out the community forum for people working on similar work, to document your own creations, or to get help on anything.
