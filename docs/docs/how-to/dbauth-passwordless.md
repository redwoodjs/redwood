# Setting up dbAuth to be passwordless

Security is really important.  Sometimes you don't want to integrate with a third-party service like Auth0 or Firebase Auth.  In this case, you can use the built-in dbAuth to authenticate users.  This is a great option if you're building a small app and don't want to pay for a third-party service.

However, dbAuth stores passwords and salts in your database. This is a security risk.  One way to mitigate this risk is to use a passwordless authentication method.  In this case, you send a link to the user's email address.  When they click the link, they are logged in.

In this how-to I'll show you how to set up dbAuth to be passwordless, you'll still need to set up a third-party service to send emails.

## Background

Let me start by sharing a little bit about how passwordless works.
### What is a passwordless authentication method?
A passwordless authentication method is a method of authentication where the user is not required to enter a password.  Instead, the user is sent a link to their email address.  When they click the link, they are logged in.

Passwordless uses a token that is time-sensitive.  So instead of storing a password, we store a token, and an expiration.

That token is generated randomly and is stored in the database.
## How to do it
### 1. Modify the Prisma schema
First, we need to modify the Prisma schema.

If you followed the tutorial you'll have a `User` model.  Here's is what it looks like with after the changes.

```jsx {4-6}
model User {
  id                  Int       @id @default(autoincrement())
  name                String?
  email               String    @unique
  loginToken          String
  loginTokenExpiresAt DateTime?
  salt                String?
}
```

Make note of the optional `salt` field.

Once you've made the changes, you'll need to migrate your database.

```bash
yarn rw prisma migrate dev
```

### 2. Setting up the generateToken function
Next, we need to create a function that will generate a token and an expiration date.

If you followed the tutorial, you might not have a `/api/src/services/users/users.js` file.  If that's the case, you can create it.

```bash
yarn rw g service users
```

Now that you have the file, let's add the `generateToken` function.

```js
// add this to the bottom of the file
// api/src/services/users/users.js
export const generateToken = asnyc ({ email }) => {
    // this method is called when a user requests a token
    // so whatever we return with the user will see on the screen
    let user = await db.user.findUnique({ where: { email } })
    // if the user doesn't exist, we still respond
    if (!user) return { message: 'Login Request received' }
    let randomNumber = (()=>{
      let number = Math.floor(Math.random() * 1000000)
      if(number < 100000) number += 100000
      return number
    })()
    // this would be where you'd send an email, for now we'll just log it
    console.log({ randomNumber })

    // next we need to create a new salt
    let salt = (()=>{
      let charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
      charSet += 'abcdefghijklmnopqrstuvwxyz'
      charSet += '0123456789'
      let returnSalt = ''
      for(let i = 0; i < 30; i++){
        returnSalt += charSet.charAt(Math.floor(Math.random() * charSet.length))
      }
      return returnSalt
    })()

    // now we need to hash the random number
    let loginToken = CryptoJS.PBKDF2(randomNumber, salt, {
      keySize: 256 / 32,
    }).toString()

    // last thing we need is to set an expiration date
    let loginTokenExpiresAt = new Date()
    loginTokenExpiresAt.setMinutes(loginTokenExpiresAt.getMinutes() + 15)

    // now we need to update the user
    await db.user.update({
      where: { email },
      data: {
        loginToken,
        loginTokenExpiresAt,
        salt,
      },
    })

    return { message: 'Login Request received' }
}
```

In addition to the new function, we need to add it to the sdl file.

```js
// api/src/graphql/users.sdl.js
// ... other imports
type userTokenResponse {
  message: String!
}

type Mutation {
  // ... other mutations
  generateToken(email: String!): userTokenResponse! @skipAuth
}
```

### 3. Modify the auth function

We need to consider how we want to limit the authentication.  I've added a expiration date to the token, so we'll need to check that.

```js
// api/src/functions/auth.js
// ... other functions
const loginOptions = {
  handler: async (user) =>{
    let loginExpiresAt = new Date(user?.loginTokenExpiresAt)
    let now = new Date()
    let tokenExpired = loginExpiresAt < now
    if(tokenExpired) throw 'Login token expired'
    // if the user logged in with a token we need to break
    // the token.  We'll do this by clearing the salt and
    // expiration
    // this will make the token a one-time use
    let where = { id: user.id }
    let data = {
      loginTokenExpiresAt: null,
      salt: null,
    }
    let result = db.user.update({ where, data })
    return user
  },
  errors: {
    // here i modified the following, feel free to modify the other messages
    incorrectPassword: 'Incorrect token',
  }
}
// we also need to update the signupOptions
const signupOptions = {
  handler: ({ username, hashedPassword, salt, userAttributes }) => {
    return db.user.create({
      data: {
        email: username,
        loginToken: hashedPassword,
        salt: null,
        name: userAttributes.name,
      }
    })
  }
  // ... othter stuff
}
// and last we need to update the authFields
const authHandler = new DbAuthHandler(event, context, {
  db: db,
  authModelAccessor: 'user',
  authFields: {
    id: 'id',
    hashedPassword: 'loginToken',
    salt: 'salt',
    resetToken: 'resetToken',// we don't use this.
    resetTokenExpiresAt: 'resetTokenExpiresAt',// we don't use this.
  },
  // ... other stuff
})
```

As of right now, nothing works, lets fix that.

### 4. Making the login form

We need to make a form that will allow the user to enter their email address.

Let's start with the generator.

```bash
yarn rw g component LoginPasswordlessForm
```

This created a component in `web/src/components/LoginPasswordlessForm/LoginPasswordlessForm.js`.  Let's update it.

```jsx
// web/src/components/LoginPasswordlessForm/LoginPasswordlessForm.js
import {
  Form,
  Label,
  TextField,
  PasswordField,
  Submit,
  FieldError,
  useForm,
} from '@redwoodjs/forms'
import { navigate, routes, Link } from '@redwoodjs/router'
import { MetaTags, useMutation } from '@redwoodjs/web'
import { Toaster, toast } from '@redwoodjs/web/toast'
const GENERATE_LOGIN_TOKEN = gql`
  mutation generateLoginToken($email: String!) {
    generateLoginToken(email: $email) {
      message
    }
  }
`

const LoginPasswordlessForm = ({ setWaitingForCode, setEmail }) => {
  const [generateLoginToken, { loading, error }] = useMutation(
    GENERATE_LOGIN_TOKEN,
    {
      onCompleted: () => {
        toast.success('Check your email for a login link')
        setWaitingForCode(true)
      },
    }
  )
  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
  } = useForm()
  const onSubmit = async (data) => {
    setEmail(data.email)
    const response = await generateLoginToken({
      variables: { email: data.email },
      fetchPolicy: 'no-cache',
    })
    if (response.error) {
      toast.error(response.error)
    }
  }

  return (
    <>
      <MetaTags title="Login" />
      <main className="rw-main">
        <Toaster toastOptions={{ className: 'rw-toast', duration: 6000 }} />
        <div className="rw-scaffold rw-login-container">
          <div className="rw-segment">
            <header className="rw-segment-header">
              <h2 className="rw-heading rw-heading-secondary">Login</h2>
            </header>

            <div className="rw-segment-main">
              <div className="rw-form-wrapper">
                <Form onSubmit={onSubmit} className="rw-form-wrapper">
                  <Label
                    name="email"
                    className="rw-label"
                    errorClassName="rw-label rw-label-error"
                  >
                    Email
                  </Label>
                  <TextField
                    name="email"
                    className="rw-input"
                    errorClassName="rw-input rw-input-error"
                    validation={{
                      required: {
                        value: true,
                        message: 'Email is required',
                      },
                    }}
                  />

                  <FieldError name="email" className="rw-field-error" />
                  <div className="rw-button-group">
                    <Submit className="rw-button rw-button-blue">
                      Send Token
                    </Submit>
                  </div>
                </Form>
              </div>
            </div>
          </div>
          <div className="rw-login-link">
            <span>Don&apos;t have an account?</span>{' '}
            <Link to={routes.signup()} className="rw-link">
              Sign up!
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}

export default LoginPasswordlessForm
```

### 5. Making the login with token form

Now we also need a form that will accept the code that was sent to the user.

```bash
yarn rw g component LoginPasswordlessTokenForm
```

```jsx
// web/src/components/LoginPasswordlessTokenForm/LoginPasswordlessTokenForm.js
import { useEffect, useRef } from 'react'

import {
  Form,
  Label,
  TextField,
  PasswordField,
  Submit,
  FieldError,
  useForm,
} from '@redwoodjs/forms'
import { navigate, routes, Link } from '@redwoodjs/router'
import { MetaTags, useMutation } from '@redwoodjs/web'
import { Toaster, toast } from '@redwoodjs/web/toast'

import { useAuth } from 'src/auth'

const LoginPasswordlessTokenForm = ({ setWaitingForCode, email, code }) => {
  const { isAuthenticated, logIn } = useAuth()
  useEffect(() => {
    if (isAuthenticated) {
      navigate(routes.home())
    }
    if (email && code) {
      console.log('email', email)
      logIn({ username: email, password: code })
    }
  }, [isAuthenticated, email, code, logIn])
  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
  } = useForm()
  const onSubmit = async (data) => {
    // login expects a username and password for dbauth
    // so we are passing them.
    const response = await logIn({ username: email, password: data.loginToken })
    if (response.error) {
      toast.error(response.error)
    }
  }

  return (
    <>
      <MetaTags title="Login" />
      <main className="rw-main">
        <Toaster toastOptions={{ className: 'rw-toast', duration: 6000 }} />
        <div className="rw-scaffold rw-login-container">
          <div className="rw-segment">
            <header className="rw-segment-header">
              <h2 className="rw-heading rw-heading-secondary">
                Login with Token
              </h2>
            </header>

            <div className="rw-segment-main">
              <div className="rw-form-wrapper">
                <Form onSubmit={onSubmit} className="rw-form-wrapper">
                  <Label
                    name="email"
                    className="rw-label"
                    errorClassName="rw-label rw-label-error"
                  >
                    Email
                  </Label>
                  <TextField
                    name="email"
                    className="rw-input"
                    errorClassName="rw-input rw-input-error"
                    readOnly={true}
                    defaultValue={email}
                  />

                  <FieldError name="email" className="rw-field-error" />
                  <Label
                    name="loginToken"
                    className="rw-label"
                    errorClassName="rw-label rw-label-error"
                  >
                    Token
                  </Label>
                  <TextField
                    name="loginToken"
                    className="rw-input"
                    errorClassName="rw-input rw-input-error"
                  />

                  <FieldError name="loginToken" className="rw-field-error" />
                  <div className="rw-button-group">
                    <Submit className="rw-button rw-button-blue">Login</Submit>
                  </div>
                  <div className="rw-button-group">
                    <button
                      className="rw-button rw-button-blue"
                      onClick={() => {
                        setWaitingForCode(false)
                      }}
                    >
                      Get another Token
                    </button>
                  </div>
                </Form>
              </div>
            </div>
          </div>
          <div className="rw-login-link">
            <span>Don&apos;t have an account?</span>{' '}
            <Link to={routes.signup()} className="rw-link">
              Sign up!
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}

export default LoginPasswordlessTokenForm
```
### 6. Making the new login page
Now each of those forms are controlled with the props we pass to them. We will make a new page that will control the state of the forms.

```bash
yarn rw g page LoginPasswordless
```

```jsx
import { useEffect, useState } from 'react'

import { useLocation } from '@redwoodjs/router'
import { MetaTags } from '@redwoodjs/web'

import LoginPasswordlessForm from 'src/components/LoginPasswordlessForm/LoginPasswordlessForm'
import LoginPasswordlessTokenForm from 'src/components/LoginPasswordlessTokenForm/LoginPasswordlessTokenForm'

const LoginPasswordlessPage = () => {
  let [waitingForCode, setWaitingForCode] = useState(false)
  let [email, setEmail] = useState()
  let [code, setCode] = useState()
  // onload set email from query string
  let { search } = useLocation()
  useEffect(() => {
    let params = new URLSearchParams(search)
    // decode magic param
    let magic = params.get('magic')
    let decoded = atob(params.get('magic'))
    // if magic param exists, set email and waitingForCode
    if (magic) {
          // decoded is email:code
      let [email, code] = decoded.split(':')
      setEmail(email)
      setCode(code)
      setWaitingForCode(true)
    }
  }, [search])

  return (
    <>
      <MetaTags
        title="LoginPasswordless"
        description="LoginPasswordless page"
      />

      {!waitingForCode && (
        <LoginPasswordlessForm
          setWaitingForCode={setWaitingForCode}
          setEmail={setEmail}
        />
      )}
      {waitingForCode && (
        <LoginPasswordlessTokenForm
          email={email}
          setWaitingForCode={setWaitingForCode}
          code={code}
        />
      )}
    </>
  )
}

export default LoginPasswordlessPage
```
### 7. Updating the signup page
We need to update the signup page to just take the email.

```jsx
// web/src/pages/SignupPage/SignupPage.js
import { useRef } from 'react'
import { useEffect } from 'react'

import {
  Form,
  Label,
  TextField,
  PasswordField,
  FieldError,
  Submit,
} from '@redwoodjs/forms'
import { Link, navigate, routes } from '@redwoodjs/router'
import { MetaTags } from '@redwoodjs/web'
import { toast, Toaster } from '@redwoodjs/web/toast'

import { useAuth } from 'src/auth'

const SignupPage = () => {
  const { isAuthenticated, signUp } = useAuth()
  let randomString = () => {
    return Math.random().toString(36).substring(2, 15)
  }
  useEffect(() => {
    if (isAuthenticated) {
      navigate(routes.home())
    }
  }, [isAuthenticated])

  // focus on username box on page load
  const emailRef = useRef(null)
  useEffect(() => {
    emailRef.current?.focus()
  }, [])

  const onSubmit = async (data) => {
    const response = await signUp({
      username: data.email,
      password: randomString(), // this is a random string and is not important
    })

    if (response.message) {
      toast(response.message)
    } else if (response.error) {
      toast.error(response.error)
    } else {
      // user is signed in automatically
      toast.success('Welcome!')
    }
  }

  return (
    <>
      <MetaTags title="Signup" />

      <main className="rw-main">
        <Toaster toastOptions={{ className: 'rw-toast', duration: 6000 }} />
        <div className="rw-scaffold rw-login-container">
          <div className="rw-segment">
            <header className="rw-segment-header">
              <h2 className="rw-heading rw-heading-secondary">Signup</h2>
            </header>

            <div className="rw-segment-main">
              <div className="rw-form-wrapper">
                <Form onSubmit={onSubmit} className="rw-form-wrapper">
                  <Label
                    name="email"
                    className="rw-label"
                    errorClassName="rw-label rw-label-error"
                  >
                    Email
                  </Label>
                  <TextField
                    name="email"
                    className="rw-input"
                    errorClassName="rw-input rw-input-error"
                    ref={emailRef}
                    validation={{
                      required: {
                        value: true,
                        message: 'Email is required',
                      },
                    }}
                  />
                  <FieldError name="email" className="rw-field-error" />

                  <div className="rw-button-group">
                    <Submit className="rw-button rw-button-blue">
                      Sign Up
                    </Submit>
                  </div>
                </Form>
              </div>
            </div>
          </div>
          <div className="rw-login-link">
            <span>Already have an account?</span>{' '}
            <Link to={routes.login()} className="rw-link">
              Log in!
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}

export default SignupPage
```

### 7. Updating the routes
The last thing we need to to do is update the routes to use the new page.

```jsx
// web/src/Routes.js
const Routes = () => {
  // other stuff
  return (
    <Router useAuth={useAuth}>
      <Route path="/login" page={LoginPasswordlessPage} name="login" />
      <Route path="/signup" page={SignupPage} name="signup" />
      {/*other routes*/}
    </Router>
  )
}
```
