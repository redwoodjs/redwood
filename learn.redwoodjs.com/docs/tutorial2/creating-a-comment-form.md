---
id: creating-a-comment-form
title: "Creating a Comment Form"
sidebar_label: "Creating a Comment Form"
---

Let's generate a form and then we'll build it out and integrate it via Storybook, then add some tests:

```bash
yarn rw g component CommentForm
```

And startup Storybook again if it isn't still running:

```bash
yarn rw storybook
```

You'll see that there's a **CommentForm** entry in Storybook now, ready for us to get started.

### Storybook

Let's build a simple form to take the user's name and their comment and add some styling to match it to the blog:

```javascript
// web/src/components/CommentForm/CommentForm.js

import {
  Form,
  Label,
  TextField,
  TextAreaField,
  Submit,
} from '@redwoodjs/forms'

const CommentForm = () => {
  return (
    <div>
      <h3 className="font-light text-lg text-gray-600">Leave a Comment</h3>
      <Form className="mt-4 w-full">
        <Label name="name" className="block text-sm text-gray-600 uppercase">
          Name
        </Label>
        <TextField
          name="name"
          className="block w-full p-1 border rounded text-xs "
          validation={{ required: true }}
        />

        <Label
          name="body"
          className="block mt-4 text-sm text-gray-600 uppercase"
        >
          Comment
        </Label>
        <TextAreaField
          name="body"
          className="block w-full p-1 border rounded h-24 text-xs"
          validation={{ required: true }}
        />

        <Submit
          className="block mt-4 bg-blue-500 text-white text-xs font-semibold uppercase tracking-wide rounded px-3 py-2 disabled:opacity-50"
        >
          Submit
        </Submit>
      </Form>
    </div>
  )
}

export default CommentForm
```

Note that the form and its inputs are set to 100% width. Again, the form shouldn't be dictating anything about its layout that its parent should be responsible for, like how wide the inputs are. Those should be determined by whatever contains it so that it looks good with the rest of the content on the page. So the form will be 100% wide and the parent (whoever that ends up being) will decide how wide it really is on the page.

And let's add some margin around the whole component in Storybook so that the 100% width doesn't run into the Storybook frame:

```javascript {7,9}
// web/src/components/CommentForm/CommentForm.stories.js

import CommentForm from './CommentForm'

export const generated = () => {
  return (
    <div className="m-4">

      <CommentForm />
    </div>  )
}

export default { title: 'Components/CommentForm' }
```

![image](https://user-images.githubusercontent.com/300/100663134-b5ef9900-330a-11eb-8ba3-e9e4bfe89b84.png)

You can even try submitting the form right in Storybook! If you leave "name" or "comment" blank then they should get focus when you try to submit, indicating that they are required. If you fill them both in and click **Submit** nothing happens because we haven't hooked up the submit yet. Let's do that now.

### Submitting

Submitting the form should use the `createComment` function we added to our services and GraphQL. We'll need to add a mutation to the form component and an `onSubmit` hander to the form so that the create can be called with the data in the form. And since `createComment` could return an error we'll add the **FormError** component to display it:

```javascript {5,11,13-22,25,27-29,34,35-39,65}
// web/src/components/CommentForm/CommentForm.js

import {
  Form,
  FormError,
  Label,
  TextField,
  TextAreaField,
  Submit,
} from '@redwoodjs/forms'
import { useMutation } from '@redwoodjs/web'

const CREATE = gql`
  mutation CreateCommentMutation($input: CreateCommentInput!) {
    createComment(input: $input) {
      id
      name
      body
      createdAt
    }
  }
`

const CommentForm = () => {
  const [createComment, { loading, error }] = useMutation(CREATE)

  const onSubmit = (input) => {
    createComment({ variables: { input } })
  }

  return (
    <div>
      <h3 className="font-light text-lg text-gray-600">Leave a Comment</h3>
      <Form className="mt-4 w-full" onSubmit={onSubmit}>
        <FormError
          error={error}
          titleClassName="font-semibold"
          wrapperClassName="bg-red-100 text-red-900 text-sm p-3 rounded"
        />
        <Label
          name="name"
          className="block text-xs font-semibold text-gray-500 uppercase"
        >
          Name
        </Label>
        <TextField
          name="name"
          className="block w-full p-1 border rounded text-sm "
          validation={{ required: true }}
        />

        <Label
          name="body"
          className="block mt-4 text-xs font-semibold text-gray-500 uppercase"
        >
          Comment
        </Label>
        <TextAreaField
          name="body"
          className="block w-full p-1 border rounded h-24 text-sm"
          validation={{ required: true }}
        />

        <Submit
          disabled={loading}
          className="block mt-4 bg-blue-500 text-white text-xs font-semibold uppercase tracking-wide rounded px-3 py-2 disabled:opacity-50"
        >
          Submit
        </Submit>
      </Form>
    </div>
  )
}

export default CommentForm
```

If you try to submit the form you'll get an error in the web console—Storybook will automatically mock GraphQL queries, but not mutations. But, we can mock the request in the story and handle the response manually:

```javascript {6-18}
// web/src/components/CommentForm/CommentForm.stories.js

import CommentForm from './CommentForm'

export const generated = () => {
  mockGraphQLMutation('CreateCommentMutation', (variables, { ctx }) => {
    const id = parseInt(Math.random() * 1000)
    ctx.delay(1000)

    return {
      comment: {
        id,
        name: variables.input.name,
        body: variables.input.body,
        createdAt: new Date().toISOString(),
      },
    }
  })

  return (
    <div className="m-4">
      <CommentForm />
    </div>
  )
}

export default { title: 'Components/CommentForm' }
```

To use `mockGraphQLMutation` you call it with the name of the mutation you want to intercept and then the function that will handle the interception and return a response. The arguments passed to that function give us some flexibility in how we handle the response.

In our case we want the `variables` that were passed to the mutation (the `name` and `body`) as well as the context object (abbreviated as `ctx`) so that we can add a delay to simulate a round trip to the server. This will let us test that the **Submit** button is disabled for that one second and you can't submit a second comment while the first one is still being saved.

Try out the form now and the error should be gone. Also the **Submit** button should become visually disabled and clicking it during that one second delay does nothing.

### Adding the Form to the Blog Post

Right above the display of existing comments on a blog post is probably where our form should go. So should we add it to the **BlogPost** along with the **CommentsCell** component? If wherever we display a list of comments we'll also include the form to add a new one, that feels like it may as well just go into the **CommentsCell** component itself. However, this presents a problem:

If we put the **CommentForm** in the **Success** component of **CommentsCell** then what happens when there are no comments yet? The **Empty** component renders, which doesn't include the form! So it becomes impossible to add the first comment.

We could copy the **CommentForm** to the **Empty** component as well, but as soon as you find yourself duplicating code like this it can be a hint that you need to rethink something about your design.

Maybe **CommentsCell** should really only be responsible for retrieving and displaying comments. Having it also accept user input seems outside of its primary concern.

So let's use **BlogPost** as the cleaning house for where all these disparate parts are combined—the actual blog post, the form to add a new comment, and the list of comments:

```javascript {5,23-24,28}
// web/src/components/BlogPost/BlogPost.js

import { Link, routes } from '@redwoodjs/router'
import CommentsCell from 'src/components/CommentsCell'
import CommentForm from 'src/components/CommentForm'

const truncate = (text, length) => {
  return text.substring(0, length) + '...'
}

const BlogPost = ({ post, summary = false }) => {
  return (
    <article className="mt-10">
      <header>
        <h2 className="text-xl text-blue-700 font-semibold">
          <Link to={routes.blogPost({ id: post.id })}>{post.title}</Link>
        </h2>
      </header>
      <div className="mt-2 text-gray-900 font-light">
        {summary ? truncate(post.body, 100) : post.body}
      </div>
      {!summary && (
        <div className="mt-16">
          <CommentForm />
          <div className="mt-24">
            <CommentsCell />
          </div>
        </div>
      )}
    </article>
  )
}

export default BlogPost
```

That looks better!

![image](https://user-images.githubusercontent.com/300/100779113-c06a6b00-33bc-11eb-9112-0f7fc30a3f22.png)

Now comes the ultimate test: creating a comment! LET'S DO IT:

![image](https://user-images.githubusercontent.com/300/100806468-5d40fe80-33e5-11eb-89f7-e4b504078eff.png)

When we created our data schema we said that a post belongs to a comment via the `postId` field. And that field is required, so the GraphQL server is rejecting the request because we're not including that field. We're only sending `name` and `body`. Luckily we have access to the ID of the post we're commenting on thanks to the `post` object that's being passed into **BlogPost** itself!

> **Why didn't the Storybook story we wrote earlier expose this problem?**
>
> We manually mocked the GraphQL response in the story, and our mock always returns a correct response, regardless of the input!
>
> There's always a tradeoff when creating mock data—it greatly simplifies testing by not having to rely on the entire GraphQL stack, but that means if you want it to be as accurate as the real thing you basically need to *re-write the real thing in your mock*. In this case, leaving out the `postId` was a one-time fix so it's probably not worth going through the work of creating a story/mock/test that simulates what would happen if we left it off.
>
> But, if **CommentForm** ended up being a component that was re-used throughout your application, or the code itself will go through a lot of churn because other developers will constantly be making changes to it, it might be worth investing the time to make sure the interface (the props passed to it and the expected return) are exactly what you want them to be.

First let's pass the post's ID as a prop to **CommentForm**:

```javascript {16}
// web/src/components/BlogPost/BlogPost.js

const BlogPost = ({ post, summary = false }) => {
  return (
    <article className="mt-10">
      <header>
        <h2 className="text-xl text-blue-700 font-semibold">
          <Link to={routes.blogPost({ id: post.id })}>{post.title}</Link>
        </h2>
      </header>
      <div className="mt-2 text-gray-900 font-light">
        {summary ? truncate(post.body, 100) : post.body}
      </div>
      {!summary && (
        <div className="mt-16">
          <CommentForm postId={post.id} />
          <div className="mt-24">
            <CommentsCell />
          </div>
        </div>
      )}
    </article>
  )
}
```

And then we'll append that ID to the `input` object that's being passed to `createComment` in the **CommentForm**:

```javascript {3,7}
// web/src/components/CommentForm/CommentForm.js

const CommentForm = ({ postId }) => {
  const [createComment, { loading, error }] = useMutation(CREATE)

  const onSubmit = (input) => {
    createComment({ variables: { input: { postId, ...input } } })
  }

  return (
    //...
  )
}
```

Now fill out the comment form and submit! And...nothing happened! Believe it or not that's actually an improvement in the situation—no more error! What if we reload the page?

![image](https://user-images.githubusercontent.com/300/100950150-98fcc680-34c0-11eb-8808-944637b5ca1f.png)

Yay! It would have been nicer if that comment appeared as soon as we submitted the comment, so maybe that's a half-yay? Also, the text boxes stayed filled with our name/messages which isn't ideal. But, we can fix both of those! One involves telling the GraphQL client (Apollo) that we created a new record and, if it would be so kind, to try the query again that gets the comments for this page, and we'll fix the other by just removing the form from the page completely when a new comment is submitted.

### GraphQL Query Caching

Much has been written about the [complexities](https://medium.com/swlh/how-i-met-apollo-cache-ee804e6485e9) of [Apollo](https://medium.com/@galen.corey/understanding-apollo-fetch-policies-705b5ad71980) [caching](https://levelup.gitconnected.com/basics-of-caching-data-in-graphql-7ce9489dac15), but for the sake of brevity (and sanity) we're going to do the easiest thing that works, and that's tell Apollo to just re-run the query that shows comments in the cell, known as "refetching."

Along with the variables you pass to a mutation function (`createComment` in our case) there's an option named `refetchQueries` where you pass an array of queries that should be re-run because, presumably, the data you just mutated is reflected in the result of those queries. In our case there's a single query, the **QUERY** export of **CommentsCell**. We'll import that at the top of **CommentForm** (and rename so it's clear what it is to the rest of our code) and then pass it along to the `refetchQueries` option:

```javascript {12,17-19}
// web/src/components/CommentForm/CommentForm.js

import {
  Form,
  FormError,
  Label,
  TextField,
  TextAreaField,
  Submit,
} from '@redwoodjs/forms'
import { useMutation } from '@redwoodjs/web'
import { QUERY as CommentsQuery } from 'src/components/CommentsCell'

// ...

const CommentForm = ({ postId }) => {
  const [createComment, { loading, error }] = useMutation(CREATE, {
    refetchQueries: [{ query: CommentsQuery }],
  })

  //...
}
```

Now when we create a comment it appears right away! It might be hard to tell because it's at the bottom of the comments list (which is a fine position if you want to read comments in chronological order, oldest to newest). Let's pop up a little notification that the comment was successful to let the user know their contribution was successful.

We'll make use of good old fashioned React state to keep track of whether a comment has been posted in the form yet or not. If so, let's remove the comment form completely and show a "Thanks for your comment" message. We'll remove the form and show the message with just a couple of CSS classes:

```javascript {13,18,20-22,31,33-39,41}
// web/src/components/CommentForm/CommentForm.js

import {
  Form,
  FormError,
  Label,
  TextField,
  TextAreaField,
  Submit,
} from '@redwoodjs/forms'
import { useMutation } from '@redwoodjs/web'
import { QUERY as CommentsQuery } from 'src/components/CommentsCell'
import { useState } from 'react'

// ...

const CommentForm = ({ postId }) => {
  const [hasPosted, setHasPosted] = useState(false)
  const [createComment, { loading, error }] = useMutation(CREATE, {
    onCompleted: () => {
      setHasPosted(true)
    },
    refetchQueries: [{ query: CommentsQuery }],
  })

  const onSubmit = (input) => {
    createComment({ variables: { input: { postId, ...input } } })
  }

  return (
    <div className="relative">
      <h3 className="font-light text-lg text-gray-600">Leave a Comment</h3>
      <div
        className={`${
          hasPosted ? 'absolute' : 'hidden'
        } flex items-center justify-center w-full h-full text-lg`}
      >
        <h4 className="text-green-500">Thank you for your comment!</h4>
      </div>
      <Form
        className={`mt-4 w-full ${hasPosted ? 'invisible' : ''}`}
        onSubmit={onSubmit}
      >
      //...
```

![image](https://user-images.githubusercontent.com/300/100949950-2d1a5e00-34c0-11eb-8c1c-3c9f925c6ecb.png)

We used `invisible` to just hide the form but have it still take up as much vertical space as it did before so that the comments don't suddenly jump up the page, which could be a little jarring.

So it looks like we're just about done here! Try going back to the homepage and go to another blog post. Let's bask in the glory of our amazing coding abilities and—OH NO:

![image](https://user-images.githubusercontent.com/300/100950583-7d45f000-34c1-11eb-8975-2c6f22c67843.png)

All posts have the same comments! **WHAT HAVE WE DONE??**

Remember our foreshadowing callout a few pages back, wondering if our `comments()` service which only returns *all* comments could come back to bite us? It finally has: when we get the comments for a post we're not actually getting them for only that post. We're ignoring the `postId` completely and just returning *all* comments in the database! Turns out the old axiom is true: computers only do exactly what you tell them to do. :(

Let's fix it!

### Returning Only Some Comments

We'll need to make both frontend and backend changes to get only some comments to show. Let's start with the backend and do a little test-driven development to make this change.

#### Introducing the Redwood Console

It would be nice if we could try out sending some arguments to our Prisma calls and be sure that we can request a single post's comments without having to write the whole stack into the app (component/cell, GraphQL, service) just to see if it works.

That's where the Redwood Console comes in! In a new terminal instance, try this:

```bash
yarn rw console
```

You'll see a standard Node console but with most of Redwood's internals already imported and ready to go! Most importantly, that includes the database. Try it out:

```bash
> db.comment.findMany()
[
  {
    id: 1,
    name: 'Rob',
    body: 'The first real comment!',
    postId: 1,
    createdAt: 2020-12-08T23:45:10.641Z
  },
  {
    id: 2,
    name: 'Tom',
    body: 'Here is another comment',
    postId: 1,
    createdAt: 2020-12-08T23:46:10.641Z
  }
]
```

(Output will be slightly different, of course, depending on what comments you already have in your database.)

Let's try the syntax that will allow us to only get comments for a given `postId`:

```bash
> db.comment.findMany({ where: { postId: 1 }})
[
  {
    id: 1,
    name: 'Rob',
    body: 'The first real comment!',
    postId: 1,
    createdAt: 2020-12-08T23:45:10.641Z
  },
  {
    id: 2,
    name: 'Tom',
    body: 'Here is another comment',
    postId: 1,
    createdAt: 2020-12-08T23:46:10.641Z
  }
]
```

Well it worked, but the list is exactly the same. That's because we've only added comments for a single post! Let's create a comment for a second post and make sure that only those comments for a specific `postId` are returned.

We'll need the `id` of another post. Make sure you have at least two (create one through the admin if you need to). We can get a list of all the existing posts and copy the `id`:

```bash
> db.post.findMany({ select: { id: true } })
[ { id: 1 }, { id: 2 }, { id: 3 } ]
```

Okay, now let's create a comment for that second post via the console:

```bash
> db.comment.create({ data: { name: 'Peter', body: 'I also like leaving comments', postId: 2 } })
{
  id: 3,
  name: 'Peter',
  body: 'I also like leaving comments',
  postId: 2,
  createdAt: 2020-12-08T23:47:10.641Z
}
```

Now we'll try our comment query again, once with each `postId`:

```bash
> db.comment.findMany({ where: { postId: 1 }})
[
  {
    id: 1,
    name: 'Rob',
    body: 'The first real comment!',
    postId: 1,
    createdAt: 2020-12-08T23:45:10.641Z
  },
  {
    id: 2,
    name: 'Tom',
    body: 'Here is another comment',
    postId: 1,
    createdAt: 2020-12-08T23:46:10.641Z
  }
]

> db.comment.findMany({ where: { postId: 2 }})
[
  {
    id: 3,
    name: 'Peter',
    body: 'I also like leaving comments',
    postId: 2,
    createdAt: 2020-12-08T23:45:10.641Z
  },

```

Great! Now that we've tested out the syntax let's use that in the service. You can exit the console by pressing Ctrl-C twice or typing `.exit`

> **Where's the `await`?**
>
> Calls to `db` return a Promise, which you would normally need to add an `await` to in order to get the results right away. Having to add `await` every time is pretty annoying though, so the Redwood console does it for you—Redwood `await`s so you don't have to!

#### Updating the Service

Try running the test suite (or if it's already running take a peek at that terminal window) and make sure all of our tests still pass. The "lowest level" of the api-side is the services, so let's start there.

> One way to think about your codebase is a "top to bottom" view where the top is what's "closest" to the user and what they interact with (React components) and the bottom is the "farthest" thing from them, in the case of a web application that would usually be a database or other data store (behind a third party API, perhaps). One level above the database are the services, which directly communicate to the database:
>
> ```
>    Browser
>       |
>     React    ─┐
>       |       │
>    Graph QL   ├─ Redwood
>       |       │
>    Services  ─┘
>       |
>    Database
> ```
>
> There are no hard and fast rules here, but generally the farther down you put your business logic (the code that deals with moving and manipulating data) the easier it will be to build and maintain your application. Redwood encourages you to put your business logic in services since they're "closest" to the data and behind the GraphQL interface.

Open up the **comments** service test and let's update it to pass the `postId` argument to the `comments()` function like we tested out in the console:

```javascript {4}
// api/src/services/comments/comments.test.js

scenario('returns all comments', async (scenario) => {
  const result = await comments({ postId: scenario.comment.jane.postId })
  expect(result.length).toEqual(Object.keys(scenario.comment).length)
})
```

When the test suite runs everything will still pass. Javascript won't care if you're passing an argument all of a sudden (although if you were using Typescript you will actually get an error at this point!). In TDD you generally want to get your test to fail before adding code to the thing you're testing which will then cause the test to pass. What's something in this test that will be different once we're only returning *some* comments? How about the number of comments expected to be returned?

Based on our current scenario, each comment will also get associated with its own, unique post. So of the two comments in our scenario, only one should be returned for a given `postId`:

```javascript {5}
// api/src/services/comments/comments.test.js

scenario('returns all comments from the database', async (scenario) => {
  const result = await comments({ postId: scenario.comment.jane.postId })
  expect(result.length).toEqual(1)
})
```

Now it should fail! Before we get it passing again, let's also change the name of the test to reflect what it's actually testing:

```javascript {3}
// api/src/services/comments/comments.test.js

scenario('returns all comments for a single post from the database', async (scenario) => {
  const result = await comments({ postId: scenario.comment.jane.postId })
  expect(result.length).toEqual(1)
})
```

Okay, open up the actual `comments.js` service and we'll update it to accept the `postId` argument and use it as an option to `findMany()`:

```javascript {3,4}
// api/src/services/comments/comments.js

export const comments = ({ postId }) => {
  return db.comment.findMany({ where: { postId } })
}
```

Save that and the test should pass again!

#### Updating GraphQL

Next we need to let GraphQL know that it should expect a `postId` to be passed for the `comments` query, and it's required (we don't currently have any view that allows you see all comments everywhere so we can ask that it always be present):

```javascript {4}
// api/src/graphql/comments.sdl.js

type Query {
  comments(postId: Int!): [Comment!]!
}
```

Now if you try refreshing the real site in dev mode you'll see an error where the comments should be displayed:

![image](https://user-images.githubusercontent.com/300/100953652-de70c200-34c7-11eb-90a5-55ca5d61d657.png)

If you inspect that error in the web inspector you'll see that it's complaining about `postId` not being present—exactly what we want!

That completes the backend updates, now we just need to tell **CommentsCell** to pass through the `postId` to the GraphQL query it makes.

#### Updating the Cell

First we'll need to get the `postId` to the cell itself. Remember when we added a `postId` prop to the **CommentForm** component so it knew which post to attach the new comment to? Let's do the same for **CommentsCell**.

Open up **BlogPost**:

```javascript {18}
// web/src/components/BlogPost/BlogPost.js

const BlogPost = ({ post, summary = false }) => {
  return (
    <article className="mt-10">
      <header>
        <h2 className="text-xl text-blue-700 font-semibold">
          <Link to={routes.blogPost({ id: post.id })}>{post.title}</Link>
        </h2>
      </header>
      <div className="mt-2 text-gray-900 font-light">
        {summary ? truncate(post.body, 100) : post.body}
      </div>
      {!summary && (
        <div className="mt-16">
          <CommentForm postId={post.id} />
          <div className="mt-24">
            <CommentsCell postId={post.id} />
          </div>
        </div>
      )}
    </article>
  )
}
```

And finally, we need to take that `postId` and pass it on to the `QUERY` in the cell:

```javascript {4,5}
// web/src/components/CommentsCell/CommentsCell.js

export const QUERY = gql`
  query CommentsQuery($postId: Int!) {
    comments(postId: $postId) {
      id
      name
      body
      createdAt
    }
  }
`
```

Where does this magical `$postId` come from? Redwood is nice enough to automatically provide it to you since you passed it in as a prop when you called the component!

Try going to a couple of different blog posts and you should see only comments associated to the proper posts (including the one we created in the console!). You can add a comment to each blog post individually and they'll stick to their proper owners:

![image](https://user-images.githubusercontent.com/300/100954162-de24f680-34c8-11eb-817b-0a7ad802f28b.png)

However, you may have noticed that now when you post a comment it no longer appears right away! ARGH! Okay, turns out there's one more thing we need to do. Remember when we told the comment creation logic to `refetchQueries`? We need to include any variables that were present the first time so that it can refetch the proper ones.

#### Updating the Form Refetch

Okay this is the last fix, promise!

```javascript {7}
// web/src/components/CommentForm/CommentForm.js

const [createComment, { loading, error }] = useMutation(CREATE, {
  onCompleted: () => {
    setHasPosted(true)
  },
  refetchQueries: [{ query: CommentsQuery, variables: { postId } }],
})
```

There we go, comment engine complete! Our blog is totally perfect and there's absolutely nothing we could do to make it better.

Or is there?

