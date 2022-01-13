---
id: role-based-authorization-control-rbac
title: "Role-Based Access Control (RBAC)"
sidebar_label: "Role-Based Access Control (RBAC)"
---

Imagine a few weeks in the future of our blog when every post hits the front page of the New York Times and we're getting hundreds of comments a day. We can't be expected to come up with quality content each day *and* moderate the endless stream of (mostly well-meaning) comments! We're going to need help. Let's hire a comment moderator to remove obvious spam and bad intentioned posts and help make the internet a better place.

We already have a login system for our blog (Netlify Identity, if you followed the first tutorial), but right now it's all-or-nothing: you either get access to create blog posts, or you don't. In this case our comment moderator(s) will need logins so that we know who they are, but we're not going let them create new blog posts. We need some kind of role that we can give to our two kinds of users so we can distinguish them from one another.

Enter role-based access control, thankfully shortened to the common phrase **RBAC**. Authentication says who the person is, authorization says what they can do. Access control is another way to say authorization. Currently the blog has the lowest common denominator of authorization: if they are logged in, they can do everything. Let's add a "less than everything, but more than nothing" level.

### Defining Roles

If you remember back in the first part of the tutorial we actually [pointed out](../tutorial/authentication#authentication-generation) that Netlify Identity provides an optional array of roles that you can attach to a user. That's exactly what we need!

> **What about other auth providers besides Netlify?**
>
> Some auth providers have a similar data structure that you can attach to a user, but if not you'll need to rely on your own database to store their roles. Read more in the [RBAC Cookbook](https://redwoodjs.com/cookbook/role-based-access-control-rbac.html#roles-from-a-database).

If you started with your own blog code from Part 1 of the tutorial and already have it deployed on Netlify, you're ready to continue! If you cloned the [redwood-tutorial](https://github.com/redwoodjs/redwood-tutorial) code from GitHub you'll need to [create a Netlify site and deploy it](../tutorial/deployment), then [enable Netlify Identity](../tutorial/authentication#netlify-identity-setup) as described in the first part of the tutorial.

> If you don't want to go through getting Netlify Identity working, but still want to follow along, you can simulate the roles returned by Netlify by just hard-coding them into `/api/src/lib/auth.js`. Just have the `getCurrentUser()` function return a simple object that contains a `roles` property:
>
> ```javascript
> // api/src/lib/auth.js
>
> export const getCurrentUser = () => {
>   return { email: 'jon.doe@example.com', roles: ['moderator'] }
> }
> ```
>
> That will get auth and roles working in development mode. If you want to simulate being logged out just return `null` instead of that object.

First we'll want to create a new user that will represent the comment moderator. You can use a completely different email address (if you have one), but if not you can use **The Plus Trick** to create a new, unique email address as far as Netlify is concerned, but that is actually the same as your original email address! **Note that not all email providers support this syntax, but the big ones like Gmail do.**

> The Plus Trick is a very handy feature of the email standard known as a "boxname", the idea being that you may have other incoming boxes besides one just named "Inbox" and by adding `+something` to your email address you can specify which box the mail should be sorted into. They don't appear to be in common use these days, but they are ridiculously helpful for us developers when we're constantly needing new email addresses for testing: it gives us an infinite number of *valid* email addresses—they all come to your regular inbox!
>
> Just append +something to your email address before the @:
>
> * `jane.doe+testing@example.com` will go to `jane.doe@example.com`
> * `dom+20210909@example.com` will go to `dom@example.com`
>
> Note that not all providers support this plus-based syntax, but the major ones (Gmail, Yahoo, Microsoft, Apple) do. If you find that you're not receiving emails at your own domain, you may want to create a free account at one of these providers just to use for testing.

Add your user and then edit them, adding a role of "moderator" in the Roles input box:

![image](https://user-images.githubusercontent.com/300/101226219-9d53eb80-3648-11eb-846e-df0eecb442ba.png)

Edit your original user to have the role "admin":

![image](https://user-images.githubusercontent.com/300/101226249-ba88ba00-3648-11eb-8e83-7b4d17822442.png)

Be sure to accept the invite for your new user and set a password so that you can actually log in as them (if you haven't deployed yet you'll need to copy the `invite_token` from the URL and use it on your local dev web server, as described [here](../tutorial/authentication#accepting-invites)).

If all went well, you should be able to log in as either user with no change in the functionality between them—both can access http://localhost:8910/admin/posts Log in as your moderator user and go there now so we can verify that we get booted out once we add some authorization rules.

### Roles in Routes

The easiest form of RBAC involves locking down entire routes. Let's add one so that only admins can see the admin pages.

In the Router simply add a `role` prop and pass it the name of the role that should be allowed. This prop also [accepts an array](https://redwoodjs.com/cookbook/role-based-access-control-rbac#how-to-protect-a-route) if more than one role should have access:

```javascript {12}
// web/src/Routes.js

import { Router, Route, Private } from '@redwoodjs/router'

const Routes = () => {
  return (
    <Router>
      <Route path="/contact" page={ContactPage} name="contact" />
      <Route path="/blog-post/{id:Int}" page={BlogPostPage} name="blogPost" />
      <Route path="/about" page={AboutPage} name="about" />
      <Route path="/" page={HomePage} name="home" />
      <Private unauthenticated="home" role="admin">
        <Route path="/admin/posts/new" page={NewPostPage} name="newPost" />
        <Route path="/admin/posts/{id:Int}/edit" page={EditPostPage} name="editPost" />
        <Route path="/admin/posts/{id:Int}" page={PostPage} name="post" />
        <Route path="/admin/posts" page={PostsPage} name="posts" />
      </Private>
      <Route notfound page={NotFoundPage} />
    </Router>
  )
}

export default Routes
```

When you save that change the browser should refresh and your moderator will be sent back to the homepage. Log out and back in as the admin user and you should still have access.

### Roles in Components

Locking down a whole page is easy enough, but what about individual functionality within a page or component?

Redwood provides a `hasRole()` function you can get from the `useAuth()` hook which returns `true` or `false` depending on whether the logged in user has the given role. Let's try it out by adding a `Delete` button when a moderator is viewing a blog post's comments:

```javascript {3,12-17,20,28-36}
// web/src/components/Comment/Comment.js

import { useAuth } from '@redwoodjs/auth'

const formattedDate = (datetime) => {
  const parsedDate = new Date(datetime)
  const month = parsedDate.toLocaleString('default', { month: 'long' })
  return `${parsedDate.getDate()} ${month} ${parsedDate.getFullYear()}`
}

const Comment = ({ comment }) => {
  const { hasRole } = useAuth()
  const moderate = () => {
    if (confirm('Are you sure?')) {
      // TODO: delete comment
    }
  }

  return (
    <div className="relative bg-gray-200 p-8 rounded-lg">
      <header className="flex justify-between">
        <h2 className="font-semibold text-gray-700">{comment.name}</h2>
        <time className="text-xs text-gray-500" dateTime={comment.createdAt}>
          {formattedDate(comment.createdAt)}
        </time>
      </header>
      <p className="text-sm mt-2">{comment.body}</p>
      {hasRole('moderator') && (
        <button
          type="button"
          onClick={moderate}
          className="absolute bottom-2 right-2 bg-red-500 text-xs rounded text-white px-2 py-1"
        >
          Delete
        </button>
      )}
    </div>
  )
}

export default Comment
```

So if the user has the "moderator" role, render the delete button. If you log out and back in as the admin, or if you log out completely, you'll see the delete button go away. When logged out (that is, `currentUser === null`) `hasRole()` will always return `false`:

![image](https://user-images.githubusercontent.com/300/101229168-c75edb00-3653-11eb-85f0-6eb61af7d4e6.png)

What should we put in place of the TODO? A GraphQL mutation that deletes a comment, of course. Thanks to our forward-thinking earlier we already have a `deleteComment()` service function and GraphQL mutation.

And due to the nice encapsulation of our **Comment** component we can make all the required web-site changes in this one component:

```javascript {4-5,13-19,23-30,33-35}
// web/src/components/Comment/Comment.js

import { useAuth } from '@redwoodjs/auth'
import { useMutation } from '@redwoodjs/web'
import { QUERY as CommentsQuery } from 'src/components/CommentsCell'

const formattedDate = (datetime) => {
  const parsedDate = new Date(datetime)
  const month = parsedDate.toLocaleString('default', { month: 'long' })
  return `${parsedDate.getDate()} ${month} ${parsedDate.getFullYear()}`
}

const DELETE = gql`
  mutation DeleteCommentMutation($id: Int!) {
    deleteComment(id: $id) {
      postId
    }
  }
`

const Comment = ({ comment }) => {
  const { hasRole } = useAuth()
  const [deleteComment] = useMutation(DELETE, {
    refetchQueries: [
      {
        query: CommentsQuery,
        variables: { postId: comment.postId },
      },
    ],
  })
  const moderate = () => {
    if (confirm('Are you sure?')) {
      deleteComment({
        variables: { id: comment.id },
      })
    }
  }

  return (
    <div className="relative bg-gray-200 p-8 rounded-lg">
      <header className="flex justify-between">
        <h2 className="font-semibold text-gray-700">{comment.name}</h2>
        <time className="text-xs text-gray-500" dateTime={comment.createdAt}>
          {formattedDate(comment.createdAt)}
        </time>
      </header>
      <p className="text-sm mt-2">{comment.body}</p>
      {hasRole('moderator') && (
        <button
          type="button"
          onClick={moderate}
          className="absolute bottom-2 right-2 bg-red-500 text-xs rounded text-white px-2 py-1"
        >
          Delete
        </button>
      )}
    </div>
  )
}

export default Comment
```

Don't forget to update the `CommentsQuery` we're importing from **CommentsCell** to include the `postId` field, since we are relying on it to perform the `refetchQuery` after a successful deletion.

```javascript {11}
// web/src/components/CommentsCell/CommentsCell.js

import Comment from 'src/components/Comment'

export const QUERY = gql`
  query CommentsQuery($postId: Int!) {
    comments(postId: $postId) {
      id
      name
      body
      postId
      createdAt
    }
  }
`
```

Click **Delete** (as a moderator) and the comment should be removed!

Ideally we'd have both versions of this component (with and without the "Delete" button) present in Storybook so we can iterate on the design. But there's no such thing as "logging in" in Storybook and our code depends on being logged in so we can check our roles...how will that work?

### Mocking currentUser for Storybook

Similar to how we can mock GraphQL calls in Storybook, we can mock user authentication and authorization functionality in a story.

In `Comment.stories.js` let's add a second story for the moderator view of the component (and rename the existing one for clarity):

```javascript {5,19-31}
// web/src/components/Comment/Comment.stories.js

import Comment from './Comment'

export const defaultView = () => {
  return (
    <div className="m-4">
      <Comment
        comment={{
          name: 'Rob Cameron',
          body: 'This is the first comment!',
          createdAt: '2020-01-01T12:34:56Z',
        }}
      />
    </div>
  )
}

export const moderatorView = () => {
  return (
    <div className="m-4">
      <Comment
        comment={{
          name: 'Rob Cameron',
          body: 'This is the first comment!',
          createdAt: '2020-01-01T12:34:56Z',
        }}
      />
    </div>
  )
}

export default { title: 'Components/Comment' }
```

The **moderatorView** story needs to have a user available that has the moderator role. We can do that with the `mockCurrentUser` function:

```javascript {4-6}
// web/src/components/Comment/Comment.stories.js

export const moderatorView = () => {
  mockCurrentUser({
    roles: ['moderator'],
  })

  return (
    <div className="m-4">
      <Comment
        comment={{
          name: 'Rob Cameron',
          body: 'This is the first comment!',
          createdAt: '2020-01-01T12:34:56Z',
        }}
      />
    </div>
  )
}
```

> **Where did `mockCurrentUser()` come from?**
>
> Similar to `mockGraphQLQuery()` and `mockGraphQLMutation()`, `mockCurrentUser()` is a global available in Storybook automatically, no need to import.

`mockCurrentUser()` accepts an object and you can put whatever you want in there (it should be similar to what you return in `getCurrentUser()` in `api/src/lib/auth.js`). But since we want `hasRole()` to work properly then the object *must* have a `roles` key that is an array of strings.

Check out **Comment** in Storybook and you should see two stories for Comment, one with a "Delete" button and one without!

![image](https://user-images.githubusercontent.com/300/102554392-99c55900-4079-11eb-94cb-78ee12d72577.png)

### Mocking currentUser for Jest

We can use the same `mockCurrentUser()` function in our Jest tests as well. Let's check that the word "Delete" is present in the component's output when the user is a moderator, and that it's not present if the user has any other role (or no role):

```javascript {3,6-10,24-37}
// web/src/components/Comment/Comment.test.js

import { render, screen, waitFor } from '@redwoodjs/testing'
import Comment from './Comment'

const COMMENT = {
  name: 'John Doe',
  body: 'This is my comment',
  createdAt: '2020-01-02T12:34:56Z',
}

describe('Comment', () => {
  it('renders successfully', () => {
    render(<Comment comment={COMMENT} />)

    expect(screen.getByText(COMMENT.name)).toBeInTheDocument()
    expect(screen.getByText(COMMENT.body)).toBeInTheDocument()
    const dateExpect = screen.getByText('2 January 2020')
    expect(dateExpect).toBeInTheDocument()
    expect(dateExpect.nodeName).toEqual('TIME')
    expect(dateExpect).toHaveAttribute('datetime', COMMENT.createdAt)
  })

  it('does not render a delete button if user is logged out', async () => {
    render(<Comment comment={COMMENT} />)

    await waitFor(() =>
      expect(screen.queryByText('Delete')).not.toBeInTheDocument()
    )
  })

  it('renders a delete button if the user is a moderator', async () => {
    mockCurrentUser({ roles: ['moderator'] })
    render(<Comment comment={COMMENT} />)

    await waitFor(() => expect(screen.getByText('Delete')).toBeInTheDocument())
  })
})
```

We moved the default `comment` object to a constant and then used that in all tests. We also needed to add `waitFor()` since the `hasRole()` check in the Comment itself actually executes some GraphQL calls behind the scenes to figure out who the user is. (The test suite actually makes mocked GraphQL calls but they're still asynchronous and need to be waited for.)

> This isn't the most robust test that's ever been written: what if the sample text of the comment itself had the word "Delete" in it? Whoops! But you get the idea—find some meaningful difference in each possible render state of a component and write a test that verifies its presence (or lack of presence).
>
> Think of each conditional in your component as another branch you need to have a test for. In the worst case, each conditional adds ^2 possible render states. If you have three conditionals that's eight possible combinations of output and to be safe you'll want to test them all. When you get yourself into this scenario it's a good sign that it's time to refactor and simplify your component. Maybe into subcomponents where each is responsible for just one of those conditional outputs? You'll still need the same number of total tests, but each component and its test is now operating in isolation and making sure it does one thing, and does it well. This has benefits for your mental model of the codebase as well.
>
> It's like finally organizing that junk drawer in the kitchen—you still have the same number of things when you're done, but each thing is in its own space and therefore easier to remember where it lives and find next time.

### Roles on the API Side

Remember: never trust the client! We need to lock down the backend to be sure that someone can't discover our `deleteComment` GraphQL resource and start deleing comments willy nilly.

Recall in Part 1 of the tutorial we used a function `requireAuth()` to be sure that someone was logged in before allowing them to take action on the server. It turns out that `requireAuth()` takes an optional `roles` key:

```javascript {4,9}
// api/src/services/comments/comments.js

import { db } from 'src/lib/db'
import { requireAuth } from 'src/lib/auth'

// ...

export const deleteComment = ({ id }) => {
  requireAuth({ roles: 'moderator' })
  return db.comment.delete({
    where: { id },
  })
}
```

We'll need a test to go along with that functionality. How do we test `requireAuth()`? The api side also has a `mockCurrentUser()` function which behaves the same as the one on the web side:

```javascript {3,7-17}
// api/src/services/comments/comments.test.js

import { comments, createComment, deleteComment } from './comments'

// ...

scenario('deletes a comment', async (scenario) => {
  mockCurrentUser({ roles: ['moderator'] })

  const comment = await deleteComment({
    id: scenario.comment.jane.id,
  })
  expect(comment.id).toEqual(scenario.comment.jane.id)

  const result = await comments({ postId: scenario.comment.jane.id })
  expect(result.length).toEqual(0)
})

```

Our first expectation here checks that we get the deleted comment back from a call to `deleteComment()`. The second expectation make sure that the comment was actually removed from the database: trying to find a comment with that `id` now returns an empty array.

### Last Word on Roles

Having a role like "admin" implies that they can do everything...shouldn't they be able to delete comments as well? Right you are! There are two things we can do here:

1. Add "admin" to the list of roles in the `hasRole()` and `requireAuth()` function calls
2. In addition to "admin", also give the "moderator" role to those users in Netlify Identity

By virtue of the name "admin" it really feels like someone should only have that one single roll and be able to do everything. So in this case it feels better to add "admin" to `hasRole()` and `requireAuth()`.

But if you wanted to be more fine-grained with your roles then maybe the "admin" role should really be called "author". That way it makes it clear they only author posts, and if you want someone to be able to do both actions you can explicitly give them the "moderator" role in addition to "author."

Managing roles can be a tricky thing to get right. Spend a little time up front thinking about how they'll interact and how much duplication you're willing to accept in your role-based function calls on the site. If you see yourself constantly adding multiple roles to `hasRole()` that may be an indication that it's time to add a single, new role that includes those abilities and remove that duplication in your code.

