# Welcome to Redwood, Part II: Redwood's Revenge

Part 1 of the tutorial was a huge success! It introduced billions (maybe an exaggeration) of developers to what Redwood could do to make web development in the Javascript ecosystem a delight. But that was just the beginning.

If you read the README [closely](https://github.com/redwoodjs/redwood#technologies) you may have seen a few technologies that we didn't touch on at all in the first tutorial: [Storybook](https://storybook.js.org/) and [Jest](https://jestjs.io/) to name a couple. In reality, these have been core to the very idea of Redwood from the beginning—an improvement to the entire experience of developing a web application.

While they're totally optional, we believe using these two tools will greatly improve your development experience, making your applications easier to develop, easier to maintain, and easier to share with a larger team. In this second tutorial we're going to show you how.

Oh, and while we're at it we'll introduce Role-based Authorization Control (RBAC), which wasn't available when we wrote the first tutorial, but is now, and it's amazing.

Why "Redwood's Revenge"? Because all great sequels have "Revenge" in their title. But also this tutorial is focused more on ourselves, the codebase in general, and making our jobs easier. Part 1 of the tutorial was about getting up and running quickly and getting an app out the door for users to start using. Part 2 is about helping us, the developers, build new features quicker and making sure the code we wrote keeps working as intended. And as the old saying goes: the best revenge is living well.

## Prerequisites

You'll need to be on at least Redwood v0.25 to make it through this tutorial.

We highly recommend going through the first tutorial or at least have built a slightly complex Redwood app on your own. You've hopefully got experience with:

- Authorization
- Cells
- GraphQL & SDLs
- Services

If you've been through the first part of the tutorial, you can pick up where you left off and continue here with part 2. Or, you can start from an [example repo](https://github.com/redwoodjs/redwood-tutorial) that picks up at the end of part 1, but already has additional styling and a starting test suite.

### Using Your Own Repo

If you want to use the same CSS classes we use in the following examples you'll need to add Tailwind to your repo:

```bash
yarn rw setup tailwind
```

However, none of the screenshots below will come anywhere close to what you're seeing (except for those isolated components you build in Storybook) so you may want to just start with the example repo below.

You'll also be missing out on a good starting test suite that we've added to the [example repo](https://github.com/redwoodjs/redwood-tutorial).

If you deployed Part 1 to a service like Netlify, you would have changed database provider in `schema.prisma` to `postgres` or `mysql`. If that's the case then make sure your local development environment has changed over as well. Check out the [Local Postgres Setup](/docs/local-postgres-setup) for assistance.

Once you're ready, start up the dev server:

```bash
yarn rw dev
```

### Using the Example Repo

If you haven't been through the first tutorial, or maybe you went through it on an older version of Redwood (anything pre-0.25) you can clone [this repo](https://github.com/redwoodjs/redwood-tutorial) which contains everything built in part 1 and also adds a little styling so it isn't quite so...tough to look at. Don't get us wrong, what we built in Part I had a great personality! We just gave it some hipper clothes and a nice haircut. We used [TailwindCSS](https://tailwindcss.com) to style things up and added a `<div>` or two to give us some additional hooks to hang styling on.

```bash
git clone https://github.com/redwoodjs/redwood-tutorial
cd redwood-tutorial
yarn install
yarn rw prisma migrate dev
yarn rw prisma db seed
yarn rw dev
```

> Note: Starting with Prisma v3.0.0, `prisma migrate dev` will also seed the database.

That'll check out the repo, install all the dependencies, create your local database and fill it with a few blog posts, and finally start up the dev server.

### Startup

Your browser should open to a fresh new blog app:

![image](https://user-images.githubusercontent.com/300/101423176-54e93780-38ad-11eb-9230-ba8557764eb4.png)

Let's run the test suite to make sure everything is working as expected (you can stop the dev server or run the command in a second terminal window):

```bash
yarn rw test
```

The `test` command starts a persistent process which watches for file changes and automatically runs any tests associated with the changed file(s) (changing a component _or_ its tests will trigger a test run).

Since we just started the suite, and we haven't changed any files yet, it may not actually run any tests at all. Hit `a` to tell it run **a**ll tests and we should get a passing suite:

![image](https://user-images.githubusercontent.com/300/96655360-21991c00-12f2-11eb-9394-c34c39b69f01.png)

If you started with your own repo from Part 1 you may see some failures here. Another reason to start with the [example repo](#using-the-example-repo).

More on testing later, but for now just know that this is always what we want to aim for—all green in that left column. In fact best practices tell us you should not even commit any code unless the test suite passes locally. Not everyone adheres to this quite as strictly as others..._&lt;cough, cough&gt;_

## Introduction to Storybook

Let's see what this Storybook thing is all about. Run this command to start up the Storybook server (again, you can cancel the test runner and run this in the same session, or start a new one):

```bash
yarn rw storybook
```

After some compiling you should get a message saying that Storybook has started and it's available at http://localhost:7910

![image](https://user-images.githubusercontent.com/300/95522673-8f078d00-0981-11eb-9551-0a211c726802.png)

If you poke around at the file tree on the left you'll see all of the components, cells, layouts and pages we created during the tutorial. Where did they come from? You may recall that every time we generated a new page/cell/component we actually created at least _three_ files:

- BlogPost.js
- BlogPost.stories.js
- BlogPost.test.js

> If you generated a cell then you also got a `.mock.js` file (more on those later).

Those `.stories.js` files are what makes the tree on the left side of the Storybook browser possible! From their homepage, Storybook describes itself as:

_"...an open source tool for developing UI components in isolation for React, Vue, Angular, and more. It makes building stunning UIs organized and efficient."_

So, the idea here is that you can build out your components/cells/pages in isolation, get them looking the way you want and displaying the correct data, then plug them into your full application.

When Storybook opened it should have opened **Components > BlogPost > Generated** which is the generated component we created to display a single blog post. If you open `web/src/components/BlogPost/BlogPost.stories.js` you'll see what it takes to explain this component to Storybook, and it isn't much:

```javascript
// web/src/components/BlogPost/BlogPost.stories.js

import BlogPost from './BlogPost'

export const generated = () => {
  return (
    <BlogPost
      post={{
        id: 1,
        title: 'First Post',
        body: `Neutra tacos hot chicken prism raw denim, put a bird on it
              enamel pin post-ironic vape cred DIY. Street art next level
              umami squid. Hammock hexagon glossier 8-bit banjo. Neutra
              la croix mixtape echo park four loko semiotics kitsch forage
              chambray. Semiotics salvia selfies jianbing hella shaman.
              Letterpress helvetica vaporware cronut, shaman butcher YOLO
              poke fixie hoodie gentrify woke heirloom.`,
        createdAt: '2020-01-01T12:34:45Z',
      }}
    />
  )
}

export default { title: 'Components/BlogPost' }
```

You import the component you want to use and then all of the named exports in the file will be a single "story" as displayed in Storybook. In this case the generator named it "generated" which shows as the "Generated" story in the tree view:

```bash
Components
└── BlogPost
    └── Generated
```

This makes it easy to create variants of your component and have them all displayed together.

> Where did that sample blog post data come from? We (the Redwood team) added that to the story in the `redwood-tutorial` repo to show you what a story might look like after you hook up some sample data. Several of the stories need data like this, some inline and some in those `mock.js` files. The rest of the tutorial will be showing you how to do this yourself with new components as you create them.

## Our First Story

Let's say that on our homepage we only want to show the first couple of sentences in our blog post as a short summary, and then you'll have to click through to see the full post.

First let's update the **BlogPost** component to contain that functionality:

```javascript{5-7,9,18}
// web/src/components/BlogPost/BlogPost.js

import { Link, routes } from '@redwoodjs/router'

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
    </article>
  )
}

export default BlogPost
```

We'll pass an additional `summary` prop to the component to let it know if it should show just the summary or the whole thing. We default it to `false` to preserve the existing behavior—always showing the full body.

Now in the Storybook story let's create a `summary` story that uses **BlogPost** the same way that `generated` does, but adds the new prop. We'll take the content of the sample post and put that in a constant that both stories will use. We'll also rename `generated` to `full` to make it clear what's different between the two:

```javascript{5-14,16-18,20-22}
// web/components/BlogPost/BlogPost.stories.js

import BlogPost from './BlogPost'

const POST = {
  id: 1,
  title: 'First Post',
  body: `Neutra tacos hot chicken prism raw denim, put a bird on it
         enamel pin post-ironic vape cred DIY. Street art next level
         umami squid. Hammock hexagon glossier 8-bit banjo. Neutra
         la croix mixtape echo park four loko semiotics kitsch forage
         chambray. Semiotics salvia selfies jianbing hella shaman.
         Letterpress helvetica vaporware cronut, shaman butcher YOLO
         poke fixie hoodie gentrify woke heirloom.`,
}

export const full = () => {
  return <BlogPost post={POST} />
}

export const summary = () => {
  return <BlogPost post={POST} summary={true} />
}

export default { title: 'Components/BlogPost' }
```

As soon as you save the change the stories Storybook should refresh and show the updates:

![image](https://user-images.githubusercontent.com/300/95523957-ed823a80-0984-11eb-9572-31f1c249cb6b.png)

### Displaying the Summary

Great! Now to complete the picture let's use the summary in our home page display of blog posts. The actual Home page isn't what references the **BlogPost** component though, that's in the **BlogPostsCell**. We'll add the summary prop and then check the result in Storybook:

```javascript{27}
// web/src/components/BlogPostsCell/BlogPostsCell.js

import BlogPost from 'src/components/BlogPost'

export const QUERY = gql`
  query BlogPostsQuery {
    posts {
      id
      title
      body
      createdAt
    }
  }
`

export const Loading = () => <div>Loading...</div>

export const Empty = () => <div>Empty</div>

export const Failure = ({ error }) => <div>Error: {error.message}</div>

export const Success = ({ posts }) => {
  return (
    <div className="-mt-10">
      {posts.map((post) => (
        <div key={post.id} className="mt-10">
          <BlogPost post={post} summary={true} />
        </div>
      ))}
    </div>
  )
}
```

![image](https://user-images.githubusercontent.com/300/95525432-f4ab4780-0988-11eb-9e9b-8df6641452ec.png)

And if you head to the real site you'll see the summary there as well:

![image](https://user-images.githubusercontent.com/300/101545160-b2d45880-395b-11eb-9a32-f8cb8106de7f.png)

Storybook makes it easy to create and modify your components in isolation and actually helps enforce a general best practice when building React applications: components should be self-contained and reusable by just changing the props that are sent in.

## Our First Test

So if Storybook is the first phase of creating/updating a component, phase two must be confirming the functionality with a test. Let's add a test for our new summary feature.

First let's run the existing suite to see if we broke anything:

```bash
yarn rw test
```

Well that didn't take long! Can you guess what we broke?

![image](https://user-images.githubusercontent.com/300/96655765-1b576f80-12f3-11eb-9e92-0024c19703cc.png)

The test was looking for the full text of the blog post, but remember that in **BlogPostsCell** we had **BlogPost** only display the _summary_ of the post. This test is looking for the full text match, which is no longer present on the page.

Let's update the test so that it checks for the expected behavior instead. There are entire books written on the best way to test, so no matter what we decide on testing in this code there will be someone out there to tell us we're doing it wrong. As just one example, the simplest test would be to just copy what's output and use that for the text in the test:

```javascript{7-8}
// web/src/components/BlogPostsCell.test.js

test('Success renders successfully', async () => {
  const posts = standard().posts
  render(<Success posts={posts} />)

  expect(screen.getByText(posts[0].title)).toBeInTheDocument()
  expect(screen.getByText("Neutra tacos hot chicken prism raw denim, put a bird on it enamel pin post-ironic vape cred DIY. Str...")).toBeInTheDocument()
})
```

But the number of characters we truncate to could be changed, so how do we encapsulate that in our test? Or should we? The number of characters is in the **BlogPost** component, which this one shouldn't know about. Even if we refactored the `truncate()` function into a shared place and imported it into both **BlogPost** and this test, the test will still be knowing too much about **BlogPost**—why should it know the internals of **BlogPost** and that it's making use of this `truncate()` function at all? It shouldn't!

Let's compromise—by virtue of the fact that this functionality has a prop called "summary" we can guess that it's doing _something_ to shorten the text. So what if we test three things that we can make reasonable assumptions about right now:

1. The full body of the post body _is not_ present
2. But, at least the first couple of words of the post _are_ present
3. The text that is shown ends in "..."

This gives us a buffer if we decide to truncate to something like 25 words, or even if we go up to a couple of hundred. What it _doesn't_ encompass, however, is the case where the body of the blog post is shorter than the truncate limit. In that case the full text would be present, and we should probably update the `truncate()` function to not add the `...` in that case. We'll leave adding that functionality and test case up to you to add in your free time. ;)

### Adding the Test

Okay, let's do this:

```javascript{27-34}
// web/src/components/BlogPostsCell.test.js

import { render, screen } from '@redwoodjs/testing'
import { Loading, Empty, Failure, Success } from './BlogPostsCell'
import { standard } from './BlogPostsCell.mock'

describe('BlogPostsCell', () => {
  test('Loading renders successfully', () => {
    render(<Loading />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  test('Empty renders successfully', async () => {
    render(<Empty />)
    expect(screen.getByText('Empty')).toBeInTheDocument()
  })

  test('Failure renders successfully', async () => {
    render(<Failure error={new Error('Oh no')} />)
    expect(screen.getByText(/Oh no/i)).toBeInTheDocument()
  })

  test('Success renders successfully', async () => {
    const posts = standard().posts
    render(<Success posts={posts} />)

    posts.forEach((post) => {
      const truncatedBody = post.body.substring(0, 10)
      const regex = new RegExp(`${truncatedBody}.*\.{3}`)

      expect(screen.getByText(post.title)).toBeInTheDocument()
      expect(screen.queryByText(post.body)).not.toBeInTheDocument()
      expect(screen.getByText(regex)).toBeInTheDocument()
    })
  })
})
```

This loops through each post in our `standard()` mock and for each one:

<div class="code-dl">

```javascript
const truncatedBody = post.body.substring(0, 10)
```

Create a variable `truncatedBody` containing the first 10 characters of the post body

```javascript
const regex = new RegExp(`${truncatedBody}.*\.{3}`)
```

Create a regular expression which contains those 10 characters followed by any characters `.*` until it reaches three periods `\.{3}` (the ellipsis at the end of the truncated text)

```javascript
expect(screen.getByText(post.title)).toBeInTheDocument()
```

Find the title in the page

```javascript
expect(screen.queryByText(post.body)).not.toBeInTheDocument()
```

When trying to find the _full_ text of the body, it should _not_ be present

```javascript
expect(screen.getByText(regex)).toBeInTheDocument()
```

Find the truncated-body-plus-ellipsis somewhere in the page

</div>

As soon as you saved that test file the test should have run and passed! Press `a` to run the whole suite.

> **What's the difference between `getByText()` and `queryByText()`?**
>
> `getByText()` will throw an error if the text isn't found in the document, whereas `queryByText()` will return `null` and let you continue with your testing (and is one way to test that some text is _not_ present on the page). You can read more about these in the [DOM Testing Library Queries](https://testing-library.com/docs/dom-testing-library/api-queries) docs.

To double check that we're testing what we think we're testing, open up `BlogPostsCell.js` and remove the `summary={true}` prop (or set it to `false`)—the test will fail: now the full body of the post _is_ on the page and `expect(screen.queryByText(post.body)).not.toBeInTheDocument()` _is_ in the document. Make sure to put the `summary={true}` back before we continue!

### What's the Deal with Mocks?

Mocks are used when you want to define the data that would normally be returned by GraphQL. In cells, a GraphQL call goes out (the query defined by **QUERY**) and returned to the **Success** component. We don't want to have to run the api-side server and have real data in the database just for Storybook or our tests, so Redwood intercepts those GraphQL calls and returns the data from the mock instead.

The names you give your mocks are then available in your tests and stories files. Just import the one you want to use (`standard` is imported for you in generated test files) and you can use the spread syntax to pass it through to your **Success** component.

Let's say our mock looks like this:

```javascript
export const standard = () => ({
  posts: [
    {
      id: 1,
      title: 'First Post',
      body: `Neutra tacos hot chicken prism raw denim...`,
      createdAt: '2020-01-01T12:34:56Z',
    },
    {
      id: 2,
      title: 'Second Post',
      body: `Master cleanse gentrify irony put a bird on it...`,
      createdAt: '2020-01-01T12:34:56Z',
    },
  ],
})
```

The first key in the object that's returned is named `posts`. That's also the name of the prop that's expected to be sent into **Success** in the cell:

```javascript{1}
export const Success = ({ posts }) => {
  return (
    {posts.map((post) => <BlogPost post={post} />)}
  )
}
```

So we can just spread the result of `standard()` in a story or test when using the **Success** component and everything works out:

```javascript{5}
import { Success } from './BlogPostsCell'
import { standard } from './BlogPostsCell.mock'

export const success = () => {
  return Success ? <Success {...standard()} /> : null
}

export default { title: 'Cells/BlogPostsCell' }
```

You can have as many mocks as you want, just import the names of the ones you need and send them in as props to your components.

### Testing BlogPost

Our test suite is passing again but it's a trick! We never added a test for the actual `summary` functionality that we added to the **BlogPost** component. We tested that **BlogPostsCell** requests that **BlogPost** return a summary, but what it means to render a summary is knowledge that only **BlogPost** contains.

When you get into the flow of building your app it can be very easy to overlook testing functionality like this. Wasn't it Winston Churchill who said "a thorough test suite requires eternal vigilance"? Techniques like [Test Driven Development](https://en.wikipedia.org/wiki/Test-driven_development) (TDD) were established to help combat this tendency—write the test first, watch it fail, then write the code to make the test pass so that you know every line of real code you write is backed by a test. What we're doing is affectionately known as [Development Driven Testing](https://medium.com/table-xi/development-driven-testing-673d3959dac2). You'll probably settle somewhere in the middle but one maxim is always true—some tests are better than no tests.

The summary functionality in **BlogPost** is pretty simple, but there are a couple of different ways we could test it:

- Export the `truncate()` function and test it directly
- Test the final rendered state of the component

In this case `truncate()` "belongs to" **BlogPost** and the outside world really shouldn't need to worry about it or know that it exists. If we came to a point in development where another component needed to truncate text then that would be a perfect time to move this function to a shared location and import it into both components that need it. `truncate()` could then have its own dedicated test. But for now let's keep our separation of concerns and test the one thing that's "public" about this component—the result of the render.

In this case let's just test that the output matches an exact string. You could spin yourself in circles trying to refactor the code to make it absolutely bulletproof to code changes breaking the tests, but will you ever actually need that level of flexibility? It's always a trade-off!

We'll move the sample post data to a constant and then use it in both the existing test (which tests that not passing the `summary` prop at all results in the full body being rendered) and our new test that checks for the summary version being rendered:

```javascript{6-17,21,23-24,27-37}
// web/src/components/BlogPost/BlogPost.test.js

import { render, screen } from '@redwoodjs/testing'
import BlogPost from './BlogPost'

const POST = {
  id: 1,
  title: 'First post',
  body: `Neutra tacos hot chicken prism raw denim, put a bird on it
         enamel pin post-ironic vape cred DIY. Street art next level
         umami squid. Hammock hexagon glossier 8-bit banjo. Neutra la
         croix mixtape echo park four loko semiotics kitsch forage
         chambray. Semiotics salvia selfies jianbing hella shaman.
         Letterpress helvetica vaporware cronut, shaman butcher YOLO
         poke fixie hoodie gentrify woke heirloom.`,
  createdAt: new Date().toISOString(),
}

describe('BlogPost', () => {
  it('renders a blog post', () => {
    render(<BlogPost post={POST} />)

    expect(screen.getByText(POST.title)).toBeInTheDocument()
    expect(screen.getByText(POST.body)).toBeInTheDocument()
  })

  it('renders a summary of a blog post', () => {
    render(<BlogPost post={POST} summary={true} />)

    expect(screen.getByText(POST.title)).toBeInTheDocument()
    expect(
      screen.getByText(
        'Neutra tacos hot chicken prism raw denim, put a bird \
        on it enamel pin post-ironic vape cred DIY. Str...'
      )
    ).toBeInTheDocument()
  })
})
```

Saving that change should run the tests and we'll see that our suite is still happy.

### One Last Thing

Remember we set the `summary` prop to default to `false` if it doesn't exist, which is tested by the first test case. However, we don't have a test that checks what happens if `false` is set explicitly. Feel free to add that now if you want Complete Coverage&trade;!

## Building a Component the Redwood Way

What's our blog missing? Comments. Let's add a simple comment engine so people can leave
their completely rational, well-reasoned comments on our blog posts. It's the internet,
what could go wrong?

There are two main features we need to build:

1. Comment form and creation
2. Comment retrieval and display

Which order we build them in is up to us. To ease into things, let's start with the fetching and displaying comments first and then we'll move on to more complex work of adding a form and service to create a new comment. Of course, this is Redwood, so even forms and services aren't _that_ complex!

### Storybook

Let's create a component for the display of a single comment. First up, the generator:

```bash
yarn rw g component Comment
```

Storybook should refresh and our "Generated" Comment story will be ready to go:

![image](https://user-images.githubusercontent.com/300/95784041-e9596400-0c87-11eb-9b9f-016e0264e0e1.png)

Let's think about what we want to ask users for and then display in a comment. How about just their name and the content of the comment itself? And we'll throw in the date/time it was created. Let's update the **Comment** component to accept a `comment` object with those two properties:

```javascript{3,6-8}
// web/src/components/Comment/Comment.js

const Comment = ({ comment }) => {
  return (
    <div>
      <h2>{comment.name}</h2>
      <time datetime={comment.createdAt}>{comment.createdAt}</time>
      <p>{comment.body}</p>
    </div>
  )
}

export default Comment
```

Once you save that file and Storybook reloads you'll see it blow up:

![image](https://user-images.githubusercontent.com/300/95784285-6684d900-0c88-11eb-9380-743079870147.png)

We need to update the story to include that comment object and pass it as a prop:

```javascript{8-12}
// web/src/components/Comment/Comment.stories.js

import Comment from './Comment'

export const generated = () => {
  return (
    <Comment
      comment={{
        name: 'Rob Cameron',
        body: 'This is the first comment!',
        createdAt: '2020-01-01T12:34:56Z'
      }}
    />
  )
}

export default { title: 'Components/Comment' }
```

> Note that Datetimes will come from GraphQL in ISO8601 format so we need to return one in that format here.

Storybook will reload and be much happier:

![image](https://user-images.githubusercontent.com/300/95785006-ccbe2b80-0c89-11eb-8d3b-bdf5ad5a6d63.png)

Let's add a little bit of styling and date conversion to get this **Comment** component looking like a nice, completed design element:

```javascript{3-7,11-19}
// web/src/components/Comment/Comment.js

const formattedDate = (datetime) => {
  const parsedDate = new Date(datetime)
  const month = parsedDate.toLocaleString('en-US', { month: 'long' })
  return `${parsedDate.getDate()} ${month} ${parsedDate.getFullYear()}`
}

const Comment = ({ comment }) => {
  return (
    <div className="bg-gray-200 p-8 rounded-lg">
      <header className="flex justify-between">
        <h2 className="font-semibold text-gray-700">{comment.name}</h2>
        <time className="text-xs text-gray-500" dateTime={comment.createdAt}>
          {formattedDate(comment.createdAt)}
        </time>
      </header>
      <p className="text-sm mt-2">{comment.body}</p>
    </div>
  )
}

export default Comment
```

![image](https://user-images.githubusercontent.com/300/95786526-9afa9400-0c8c-11eb-9d75-27c996ca018a.png)

It's tough to see our rounded corners, but rather than adding margin or padding to the component itself (which would add them everywhere we use the component) let's add a margin in the story so it only shows in Storybook:

```javascript{7,15}
// web/src/components/Comment/Comment.stories.js

import Comment from './Comment'

export const generated = () => {
  return (
    <div className="m-4">

      <Comment
        comment={{
          name: 'Rob Cameron',
          body: 'This is the first comment!',
          createdAt: '2020-01-01T12:34:56Z',
        }}
      />
    </div>  )
}

export default { title: 'Components/Comment' }
```

> A best practice to keep in mind when designing in HTML and CSS is to keep a visual element responsible for its own display only, and not assume what it will be contained within. In this case a Comment doesn't and shouldn't know where it will be displayed, so it shouldn't add any design influence _outside_ of its container (like forcing a margin around itself).

Now we can see our roundedness quite easily in Storybook:

![image](https://user-images.githubusercontent.com/300/95786006-aac5a880-0c8b-11eb-86d5-105a3b929347.png)

> If you haven't used TailwindCSS before just know that the `m` in the className is short for "margin" and the `4` refers to four "units" of margin. By default one unit is 0.25rem. So "m-4" is equivalent to `margin: 1rem`.

### Testing

We don't want Santa to skip our house for being naughty developers so let's test our **Comment** component. We could test that the author's name and the body of the comment appear, as well as the date it was posted.

The default test that comes with a generated component just makes sure that no errors are thrown, which is the least we could ask of our components!

Let's add a sample comment to the test and check that the various parts are being rendered:

```javascript{8-20}
// web/src/components/Comment.test.js

import { render, screen } from '@redwoodjs/testing'
import Comment from './Comment'

describe('Comment', () => {
  it('renders successfully', () => {
    const comment = {
      name: 'John Doe',
      body: 'This is my comment',
      createdAt: '2020-01-02T12:34:56Z',
    }
    render(<Comment comment={comment} />)

    expect(screen.getByText(comment.name)).toBeInTheDocument()
    expect(screen.getByText(comment.body)).toBeInTheDocument()
    const dateExpect = screen.getByText('2 January 2020')
    expect(dateExpect).toBeInTheDocument()
    expect(dateExpect.nodeName).toEqual('TIME')
    expect(dateExpect).toHaveAttribute('datetime', comment.createdAt)
  })
})

```

Here we're testing for both elements of the output `createdAt` timestamp: the actual text that's output (similar to how we tested for a blog post's truncated body) but also that the element that wraps that text is a `<time>` tag and that it contains a `datetime` attribute with the raw value of `comment.createdAt`. This might seem like overkill but the point of the `datetime` attribute is to provide a machine-readable timestamp that the browser could (theoretically) hook into and do stuff with. This makes sure that we preserve that ability!

> **What happens if we change the formatted output of the timestamp? Wouldn't we have to change the test?**
>
> Yes, just like we'd have to change the truncation text if we changed the length of the truncation. One alternative approach to testing for the formatted output could be to move the date formatting formula into a function that you can export from the Comment component. Then you can import that in your test and use it to check the formatted output. Now if you change the formula the test keeps passing because it's sharing the function with **Comment**.

## Multiple Comments

Our amazing blog posts will obviously garner a huge and passionate fanbase and we will very rarely have only a single comment. Let's work on displaying a list of comments.

Let's think about where our comments are being displayed. Probably not on the homepage, since that only shows a summary of each post. A user would need to go to the full page to show the comments for that blog post. But that page is only fetching the data for the single blog post itself, nothing else. We'll need to get the comments and since we'll be fetching _and_ displaying them, that sounds like a job for a Cell.

> **Couldn't the query for the blog post page also fetch the comments?**
>
> Yes, it could! But the idea behind Cells is to make components even more [composable](https://en.wikipedia.org/wiki/Composability) by having them be responsible for their own data fetching _and_ display. If we rely on a blog post to fetch the comments then the new Comments component we're about to create now requires something _else_ to fetch the comments and pass them in. If we re-use the Comments component somewhere, now we're fetching comments in two different places.
>
> **But what about the Comment component we just made, why doesn't that fetch its own data?**
>
> There aren't any instances I (the author) could think of where we would ever want to display only a single comment in isolation—it would always be a list of all comments on a post. If displaying a single comment was common for your use case then it could definitely be converted to a **CommentCell** and have it responsible for pulling the data for that single comment itself. But keep in mind that if you have 50 comments on a blog post, that's now 50 GraphQL calls that need to go out, one for each comment. There's always a trade-off!
>
> **Then why make a standalone Comment component at all? Why not just do all the display in the CommentsCell?**
>
> We're trying to start in small chunks to make the tutorial more digestible for a new audience so we're starting simple and getting more complex as we go. But it also just feels _nice_ to build up a UI from these smaller chunks that are easier to reason about and keep separate in your head.
>
> **But what about—**
>
> Look, we gotta end this sidebar and get back to building this thing. You can ask more questions later, promise!

### Storybook

Let's generate a **CommentsCell**:

```bash
yarn rw g cell Comments
```

Storybook updates with a new **CommentsCell** under the **Cells** folder. Let's update the Success story to use the Comment component created earlier, and return all of the fields we'll need for the **Comment** to render:

```javascript{3,9-11,24}
// web/src/components/CommentsCell/CommentsCell.js

import Comment from 'src/components/Comment'

export const QUERY = gql`
  query CommentsQuery {
    comments {
      id
      name
      body
      createdAt
    }
  }
`

export const Loading = () => <div>Loading...</div>

export const Empty = () => <div>Empty</div>

export const Failure = ({ error }) => <div>Error: {error.message}</div>

export const Success = ({ comments }) => {
  return comments.map((comment) => (
    <Comment key={comment.id} comment={comment} />
  ))
}
```

We're passing an additional `key` prop to make React happy when iterating over an array with `map`.

If you check Storybook, you'll seen an error. We'll need to update the `mock.js` file that came along for the ride when we generated the Cell so that it returns an array instead of just a simple object with some sample data:

```javascript{4-17}
// web/src/components/CommentsCell/CommentsCell.mock.js

export const standard = (/* vars, { ctx, req } */) => ({
  comments: [
    {
      id: 1,
      name: 'Rob Cameron',
      body: 'First comment',
      createdAt: '2020-01-02T12:34:56Z',
    },
    {
      id: 2,
      name: 'David Price',
      body: 'Second comment',
      createdAt: '2020-02-03T23:00:00Z',
    },
  ],
})
```

> What's this `standard` thing? Think of it as the standard, default mock if you don't do anything else. We would have loved to use the name "default" but that's already a reserved word in Javascript!

Storybook refreshes and we've got comments! We've got the same issue here where it's hard to see our rounded corners and also the two separate comments are hard to distinguish because they're right next to each other:

![image](https://user-images.githubusercontent.com/300/95799544-dce60300-0ca9-11eb-9520-a1aac4ec46e6.png)

The gap between the two comments _is_ a concern for this component, since it's responsible for drawing multiple comments and their layout. So let's fix that in **CommentsCell**:

```javascript{5,7,9,11}
// web/src/components/CommentsCell/CommentsCell.js

export const Success = ({ comments }) => {
  return (
    <div className="-mt-8">

      {comments.map((comment) => (
        <div key={comment.id} className="mt-8">
          <Comment comment={comment} />
        </div>
      ))}
    </div>  )
}
```

We had to move the `key` prop to the surrounding `<div>`. We then gave each comment a top margin and removed an equal top margin from the entire container to set it back to zero.

> Why a top margin and not a bottom margin? Remember when we said a component should be responsible for _its own_ display? If you add a bottom margin, that's one component influencing the one below it (which it shouldn't care about). Adding a _top_ margin is this component moving _itself_ down, which means it's again responsible for its own display.

Let's add a margin around the story itself, similar to what we did in the Comment story:

```javascript{5}
// web/src/components/CommentsCell/CommentsCell.stories.js

export const success = () => {
  return Success ? (
    <div className="m-8 mt-16">

      <Success {...standard()} />
    </div>  ) : null
}
```

> Why both `m-8` and `mt-16`? One of the fun rules of CSS is that if a parent and child both have margins, but no border or padding between them, their `margin-top` and `margin-bottom` [collapses](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Box_Model/Mastering_margin_collapsing). So even though the story container will have a margin of 8 (which equals 2rem) remember that the container for CommentsCell has a -8 margin (-2rem). Those two collapse and essentially cancel each other out to 0 top margin. Setting `mt-16` sets a 4rem margin, which after subtracting 2rem leaves us with 2rem, which is what we wanted to start with!

![image](https://user-images.githubusercontent.com/300/95800481-4cf58880-0cac-11eb-9457-ff3f1f0d34b8.png)

Looking good! Let's add our CommentsCell to the actual blog post display page:

```javascript{4,21}
// web/src/components/BlogPost/BlogPost.js

import { Link, routes } from '@redwoodjs/router'
import CommentsCell from 'src/components/CommentsCell'

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
      {!summary && <CommentsCell />}
    </article>
  )
}

export default BlogPost
```

If we are _not_ showing the summary, then we'll show the comments. Take a look at the **Full** and **Summary** stories and you should see comments on one and not on the other.

> **Shouldn't the CommentsCell cause an actual GraphQL request? How does this work?**
>
> Redwood has added some functionality around Storybook so if you're testing a component that itself isn't a Cell (like **BlogPost**) but that renders a cell (**CommentsCell**) that it needs to mock the GraphQL and use the `standard` mock that goes along with that Cell. Pretty cool, huh?

Once again our component is bumping right up against the edges of the window. We've got two stories in this file and would have to manually add margins around both of them. Ugh. Luckily Storybook has a way to add styling to all stories using [decorators](https://storybook.js.org/docs/react/writing-stories/decorators). In the `default` export at the bottom of the story you can define a `decorators` key and the value is JSX that will wrap all the stories in the file automatically:

```javascript{5-7}
// web/src/components/BlogPost/BlogPost.stories.js

export default {
  title: 'Components/BlogPost',
  decorators: [
    (Story) => <div className="m-8"><Story /></div>
  ]
}
```

Save, and both the **Full** and **Summary** stories should have margins around them now.

> For more extensive, global styling options, look into Storybook [theming](https://storybook.js.org/docs/react/configure/theming).

![image](https://user-images.githubusercontent.com/300/96509066-5d5bb500-1210-11eb-8ddd-8786b7033cac.png)

We could use a gap between the end of the blog post and the start of the comments to help separate the two:

```javascript{15-17}
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
        <div className="mt-24">
          <CommentsCell />
        </div>
      )}
    </article>
  )
}
```

![image](https://user-images.githubusercontent.com/300/100682809-bfd5c400-332b-11eb-98e0-d2d526c1aa58.png)

Okay, comment display is looking good! However, you may have noticed that if you tried going to the actual site there's an error where the comments should be:

![image](https://user-images.githubusercontent.com/300/101549636-e1096680-3962-11eb-83fe-930d4bc631df.png)

Why is that? Remember that we started with the `CommentsCell`, but never actually created a Comment model in `schema.prisma` or created an SDL and service! That's another neat part of working with Storybook: you can build out UI functionality completely isolated from the api-side. In a team setting this is great because a web-side team can work on the UI while the api-side team can be building the backend end simultaneously and one doesn't have to wait for the other.

### Testing

We added one component, **Comments**, and edited another, **BlogPost**, so we'll want to add tests in both.

#### Testing Comments

The actual **Comment** component does most of the work so there's no need to test all of that functionality again. What things does **CommentsCell** do that make it unique?

- Has a loading message
- Has an error message
- Has a failure message
- When it renders successfully, it outputs as many comments as were returned by the `QUERY`

The default `CommentsCell.test.js` actually tests every state for us, albeit at an absolute minimum level—it make sure no errors are thrown:

```javascript
import { render, screen } from '@redwoodjs/testing'
import { Loading, Empty, Failure, Success } from './CommentsCell'
import { standard } from './CommentsCell.mock'

describe('CommentsCell', () => {
  test('Loading renders successfully', () => {
    expect(() => {
      render(<Loading />)
    }).not.toThrow()
  })

  test('Empty renders successfully', async () => {
    expect(() => {
      render(<Empty />)
    }).not.toThrow()
  })

  test('Failure renders successfully', async () => {
    expect(() => {
      render(<Failure error={new Error('Oh no')} />)
    }).not.toThrow()
  })

  test('Success renders successfully', async () => {
    expect(() => {
      render(<Success comments={standard().comments} />)
    }).not.toThrow()
  })
})
```

And that's nothing to scoff at! As you've probably experienced, a React component usually either works 100% or throws an error. If it works, great! If it fails then the test fails too, which is exactly what we want to happen.

But in this case we can do a little more to make sure **CommentsCell** is doing what we expect. Let's update the `Success` test in `CommentsCell.test.js` to check that exactly the number of comments we passed in as a prop are rendered. How do we know a comment was rendered? How about if we check that each `comment.body` (the most important part of the comment) is present on the screen:

```javascript{4-9}
// web/src/components/CommentsCell/CommentsCell.test.js

test('Success renders successfully', async () => {
  const comments = standard().comments
  render(<Success comments={comments} />)

  comments.forEach((comment) => {
    expect(screen.getByText(comment.body)).toBeInTheDocument()
  })
})
```

We're looping through each `comment` from the mock, the same mock used by Storybook, so that even if we add more later, we're covered.

#### Testing BlogPost

The functionality we added to `<BlogPost>` says to show the comments for the post if we are _not_ showing the summary. We've got a test for both the "full" and "summary" renders already. Generally you want your tests to be testing "one thing" so let's add two additional tests for our new functionality:

```javascript{3,22-30,42-50}
// web/src/components/BlogPost/BlogPost.test.js

import { render, screen, waitFor } from '@redwoodjs/testing'
import BlogPost from './BlogPost'
import { standard } from 'src/components/CommentsCell/CommentsCell.mock'

const POST = {
  id: 1,
  title: 'First post',
  body: `Neutra tacos hot chicken prism raw denim, put a bird on it enamel pin post-ironic vape cred DIY. Street art next level umami squid. Hammock hexagon glossier 8-bit banjo. Neutra la croix mixtape echo park four loko semiotics kitsch forage chambray. Semiotics salvia selfies jianbing hella shaman. Letterpress helvetica vaporware cronut, shaman butcher YOLO poke fixie hoodie gentrify woke heirloom.`,
  createdAt: new Date().toISOString(),
}

describe('BlogPost', () => {
  it('renders a blog post', () => {
    render(<BlogPost post={POST} />)

    expect(screen.getByText(POST.title)).toBeInTheDocument()
    expect(screen.getByText(POST.body)).toBeInTheDocument()
  })

  it('renders comments when displaying a full blog post', async () => {
    const comment = standard().comments[0]
    render(<BlogPost post={POST} />)

    await waitFor(() =>
      expect(screen.getByText(comment.body)).toBeInTheDocument()
    )
  })

  it('renders a summary of a blog post', () => {
    render(<BlogPost post={POST} summary={true} />)

    expect(screen.getByText(POST.title)).toBeInTheDocument()
    expect(
      screen.getByText(
        'Neutra tacos hot chicken prism raw denim, put a bird on it enamel pin post-ironic vape cred DIY. Str...'
      )
    ).toBeInTheDocument()
  })

  it('does not render comments when displaying a summary', async () => {
    const comment = standard().comments[0]
    render(<BlogPost post={POST} summary={true} />)

    await waitFor(() =>
      expect(screen.queryByText(comment.body)).not.toBeInTheDocument()
    )
  })
})
```

We're introducing a new test function here, `waitFor()`, which will wait for things like GraphQL queries to finish running before checking for what's been rendered. Since **BlogPost** renders **CommentsCell** we need to wait for the `Success` component of **CommentsCell** to be rendered.

> The summary version of **BlogPost** does _not_ render the **CommentsCell**, but we should still wait. Why? If we did mistakenly start including **CommentsCell**, but didn't wait for the render, we would get a falsely passing test—indeed the text isn't on the page but that's because it's still showing the **Loading** component! If we had waited we would have seen the actual comment body get rendered, and the test would (correctly) fail.

Okay we're finally ready to let users create their comments.

## Adding Comments to the Schema

Let's take a moment to appreciate how amazing this is—we built, designed and tested a completely new component for our app, which displays data from an API call (which would pull that data from a database) without actually having to build any of that backend functionality! Redwood let us provide fake data to Storybook and Jest so we could get our component working.

Unfortunately, even with all of this flexibility there's still no such thing as a free lunch. Eventually we're going to have to actually do that backend work. Now's the time.

If you went through the first part of the tutorial you should be somewhat familiar with this flow:

1. Add a model to `schema.prisma`
2. Run a `yarn rw prisma migrate dev` commands to create a migration and apply it to the database
3. Generate an SDL and service

### Adding the Comment model

Let's do that now:

```javascript{17,29-36}
// api/db/schema.prisma

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider      = "prisma-client-js"
  binaryTargets = "native"
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  body      String
  comments  Comment[]
  createdAt DateTime @default(now())
}

model Contact {
  id        Int      @id @default(autoincrement())
  name      String
  email     String
  message   String
  createdAt DateTime @default(now())
}

model Comment {
  id        Int      @id @default(autoincrement())
  name      String
  body      String
  post      Post     @relation(fields: [postId], references: [id])
  postId    Int
  createdAt DateTime @default(now())
}
```

Most of these lines look very similar to what we've already seen, but this is the first instance of a [relation](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-schema/relations) between two models. `Comment` gets two entries:

- `post` which has a type of `Post` and a special `@relation` keyword that tells Prisma how to connect a `Comment` to a `Post`. In this case the field `postId` references the field `id` in `Post`
- `postId` is just a regular `Int` column which contains the `id` of the `Post` that this comment is referencing

This gives us a classic database model:

```
┌───────────┐       ┌───────────┐
│   Post    │       │  Comment  │
├───────────┤       ├───────────┤
│ id        │───┐   │ id        │
│ title     │   │   │ name      │
│ body      │   │   │ body      │
│ createdAt │   └──<│ postId    │
└───────────┘       │ createdAt │
                    └───────────┘
```

Note that there is no real database column named `post` in `Comment`—this is special syntax for Prisma to know how to connect the models together and for you to reference that connection. When you query for a `Comment` using Prisma you can get access to the attached `Post` using that name:

```javascript
db.comment.findUnique({ where: { id: 1 } }).post()
```

Prisma also added a convenience `comments` field to `Post` which gives us the same capability in reverse:

```javascript
db.post.findUnique({ where: { id: 1 } }).comments()
```

### Running the Migration

This one is easy enough: we'll create a new migration with a name and then run it:

```bash
yarn rw prisma migrate dev
```

When prompted, give this one a name something like "create comments".

> You'll need to restart the test suite runner at this point if it's still running. Redwood creates a second, test database for you to run your tests against (it is at `.redwood/test.db` by default). The database migrations are run against that test database whenever the test suite is **started**, not while it's running, so you'll need to restart it to test against the new database structure.

### Creating the SDL and Service

Next we'll create the SDL (that defines the GraphQL interface) and a service (to get the records out of the database) with a generator call:

```bash
yarn rw g sdl comment
```

That command will create both the SDL and the service. And if you take a look back in the browser you should see a different message than the GraphQL error we were seeing before:

![image](https://user-images.githubusercontent.com/300/101552505-d1405100-3967-11eb-883f-1227689e5f88.png)

"Empty" means the Cell rendered correctly! There just aren't any comments in the database yet. Let's update the **CommentsCell** component to make that "Empty" message a little more friendly:

```javascript{4}
// web/src/components/CommentsCell/CommentsCell.js

export const Empty = () => {
  return <div className="text-center text-gray-500">No comments yet</div>
}
```

That's better. Let's update the test that covers the Empty component render as well:

```javascript{4-5}
// web/src/components/CommentsCell/CommentsCell.test.js

test('Empty renders a "no comments" message', () => {
  render(<Empty />)
  expect(screen.getByText('No comments yet')).toBeInTheDocument()
})
```

Okay, let's focus on the service for bit. We'll need to add a function to let users create a new comment and we'll add a test that covers the new functionality.

### Building out the Service

By virtue of using the generator we've already got the function we need to select all comments from the database:

```javascript
// api/src/services/comments/comments.js

export const comments = () => {
  return db.comment.findMany()
}
```

> Have you noticed that something may be amiss? This function returns _all_ comments, and all comments only. Could this come back to bite us?
>
> Hmmm...

We need to be able to create a comment as well. We'll use the same convention that's used in Redwood's generated scaffolds: the create endpoint will accept a single parameter `input` which is an object with the individual model fields:

```javascript
// api/src/services/comments/comments.js

export const createComment = ({ input }) => {
  return db.comment.create({
    data: input,
  })
}
```

We'll also need to expose this function via GraphQL so we'll add a Mutation to the SDL:

```graphql{29-31}
// api/src/graphql/comments.sdl.js

export const schema = gql`
  type Comment {
    id: Int!
    name: String!
    body: String!
    post: Post!
    postId: Int!
    createdAt: DateTime!
  }

  type Query {
    comments: [Comment!]!
  }

  input CreateCommentInput {
    name: String!
    body: String!
    postId: Int!
  }

  input UpdateCommentInput {
    name: String
    body: String
    postId: Int
  }

  type Mutation {
    createComment(input: CreateCommentInput!): Comment!
  }
`
```

> The `CreateCommentInput` type was already created for us by the SDL generator.

That's all we need to create a comment! But let's think for a moment: is there anything else we need to do with a comment? Let's make the decision that users won't be able to update an existing comment. And we don't need to select individual comments (remember earlier we talked about the possibility of each comment being responsible for its own API request and display, but we decided against it).

What about deleting a comment? We won't let a user delete their own comment, but as owners of the blog we should be able to delete/moderate them. So we'll need a delete function and API endpoint as well. Let's add those:

```javascript
// api/src/services/comments/comments.js

export const deleteComment = ({ id }) => {
  return db.comment.delete({
    where: { id },
  })
}
```

```graphql{5}
// api/src/graphql/comments.sdl.js

type Mutation {
  createComment(input: CreateCommentInput!): Comment!
  deleteComment(id: Int!): Comment!
}
```

`deleteComment` will be given a single argument, the ID of the comment to delete, and it's required. A common pattern is to return the record that was just deleted in case you wanted to notify the user or some other system about the details of the thing that was just removed, so we'll do that here as well. But, you could just as well return `null`.

### Testing the Service

Let's make sure our service functionality is working and continues to work as we modify our app.

If you open up `api/src/services/comments/comments.test.js` you'll see there's one in there already, making sure that retrieving all comments (the default `comments()` function that was generated along with the service) works:

```javascript
// api/src/services/comments/comments.test.js

import { comments } from './comments'

describe('comments', () => {
  scenario('returns a list of comments', async (scenario) => {
    const list = await comments()

    expect(list.length).toEqual(Object.keys(scenario.comment).length)
  })
})
```

What is this `scenario()` function? That's made available by Redwood that mostly acts like Jest's built-in `it()` and `test()` functions, but with one important difference: it pre-seeds a test database with data that is then passed to you in the `scenario` argument. You can count on this data existing in the database and being reset between tests in case you make changes to it.

> **In the section on mocks you said relying on data in the database for testing was dumb?**
>
> Yes, all things being equal it would be great to not have these tests depend on a piece of software outside of our control.
>
> However, the difference here is that in a service almost all of the logic you write will depend on moving data in and out of a database and it's much simpler to just let that code run and _really_ access the database, rather than trying to mock and intercept each and every possible call that Prisma could make.
>
> Not to mention that Prisma itself is currently under heavy development and implementations could change at any time. Trying to keep pace with those changes and constantly keep mocks in sync would be a nightmare!
>
> That being said, if you really wanted to you could use Jest's [mocking utilities](https://jestjs.io/docs/en/mock-functions) and completely mock the Prisma interface abstract the database away completely. But don't say we didn't warn you!

Where does that data come from? Take a look at the `comments.scenarios.js` file which is next door:

```javascript
export const standard = defineScenario({
  comment: {
    one: {
      name: 'String',
      body: 'String',
      post: { create: { title: 'String', body: 'String' } },
    },
    two: {
      name: 'String',
      body: 'String',
      post: { create: { title: 'String', body: 'String' } },
    },
  },
})
```

This calls a `defineScenario()` function which will check that your data structure matches what's defined in Prisma. This is purely a type-checking feature, it doesn't change the object at all—it just returns the same object you give it.

> **The "standard" scenario**
>
> The exported scenario here is named "standard." Remember when we worked on component tests and mocks, there was a special mock named `standard` which Redwood would use by default if you didn't specify a name? The same rule applies here! When we add a test for `createComment()` we'll see an example of using a different scenario with a unique name.

The nested structure of a scenario is defined like this:

- **comment**: the name of the model this data is for
  - **one, two**: a friendly name given to the scenario data which you can reference in your tests
    - **name, message, post**: the actual data that will be put in the database. In this case a **Comment** requires that it be related to a **Post**, so the scenario has a `post` key and values as well (using Prisma's [nested create syntax](https://www.prisma.io/docs/concepts/components/prisma-client/relation-queries#nested-writes))

When you receive the `scenario` argument in your test you can follow the same object nesting in order to reference the fields, like `scenario.comment.one.name`.

> **Why does every field just contain the string "String"?**
>
> When generating the service (and the test and scenarios) all we (Redwood) knows about your data is the types for each field as defined in `schema.prisma`, namely `String`, `Integer` or `DateTime`. So we add the simplest data possible that fulfills the type requirement by Prisma to get the data into the database. You should definitely replace this data with something that looks more like the real data your app will be expecting. In fact...

Let's replace that scenario data with something more like what we expect to see in our app:

```javascript{4-25}
// api/src/services/comments/comments.scenarios.js

export const standard = defineScenario({
  comment: {
    jane: {
      name: 'Jane Doe',
      body: 'I like trees',
      post: {
        create: {
          title: 'Redwood Leaves',
          body: 'The quick brown fox jumped over the lazy dog.'
        }
      }
    },
    john: {
      name: 'John Doe',
      body: 'Hug a tree today',
      post: {
        create: {
          title: 'Root Systems',
          body: 'The five boxing wizards jump quickly.'
        }
      }
    }
  }
})
```

The test created by the service generator simply checks to make sure the same number of records are returned so changing the content of the data here won't affect the test.

#### Testing createComment()

Let's add our first service test by making sure that `createComment()` actually stores a new comment in the database. When creating a comment we're not as worried about existing data in the database so let's create a new scenario which only contains a post—the post we'll be linking the new comment to through the comment's `postId` field:

```javascript{7-14}
// api/src/services/comments/comments.scenarios.js

export const standard = defineScenario({
  // ...
})

export const postOnly = defineScenario({
  post: {
    bark: {
      title: 'Bark',
      body: "A tree's bark is worse than its bite"
    }
  }
})
```

Now we can pass the `postOnly` scenario name as the first argument to a new `scenario()` test:

```javascript{3,12-25}
// api/src/services/comments/comments.test.js

import { comments, createComment } from './comments'

describe('comments', () => {
  scenario('returns a list of comments', async (scenario) => {
    const list = await comments()

    expect(list.length).toEqual(Object.keys(scenario.comment).length)
  })

  scenario('postOnly', 'creates a new comment', async (scenario) => {
    const comment = await createComment({
      input: {
        name: 'Billy Bob',
        body: 'What is your favorite tree bark?',
        postId: scenario.post.bark.id
      }
    })

    expect(comment.name).toEqual('Billy Bob')
    expect(comment.body).toEqual('What is your favorite tree bark?')
    expect(comment.postId).toEqual(scenario.post.bark.id)
    expect(comment.createdAt).not.toEqual(null)
  })
})
```

We pass an optional first argument to `scenario()` which is the named scenario to use, instead of the default of "standard."

We were able to use the `id` of the post that we created in our scenario because the scenarios contain the actual database data after being inserted, not just the few fields we defined in the scenario itself. In addition to `id` we could access `createdAt` which is defaulted to `now()` in the database.

We'll test that all the fields we give to the `createComment()` function are actually created in the database, and for good measure just make sure that `createdAt` is set to a non-null value. We could test that the actual timestamp is correct, but that involves freezing the Javascript Date object so that no matter how long the test takes, you can still compare the value to `new Date` which is right _now_, down to the millisecond. While possible, it's beyond the scope of our easy, breezy tutorial since it gets [very gnarly](https://codewithhugo.com/mocking-the-current-date-in-jest-tests/)!

> **What's up with the names for scenario data? posts.bark? Really?**
>
> This makes reasoning about your tests much nicer! Which of these would you rather work with:
>
> "`claire` paid for an `ebook` using her `visa` credit card."
>
> or:
>
> "`user[3]` paid for `product[0]` using their `cards[2]` credit card?
>
> If you said the second one, then you probably hate kittens and sleep on broken glass.

Okay, our comments service is feeling pretty solid now that we have our tests in place. The last step is add a form so that users can actually leave a comment on a blog post.

## Creating a Comment Form

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

import { Form, Label, TextField, TextAreaField, Submit } from '@redwoodjs/forms'

const CommentForm = () => {
  return (
    <div>
      <h3 className="font-light text-lg text-gray-600">Leave a Comment</h3>
      <Form className="mt-4 w-full">
        <Label name="name" className="block text-sm text-gray-600 uppercase">
          Name
        </Label>
        <TextField name="name" className="block w-full p-1 border rounded text-xs " validation={{ required: true }} />

        <Label name="body" className="block mt-4 text-sm text-gray-600 uppercase">
          Comment
        </Label>
        <TextAreaField
          name="body"
          className="block w-full p-1 border rounded h-24 text-xs"
          validation={{ required: true }}
        />

        <Submit className="block mt-4 bg-blue-500 text-white text-xs font-semibold uppercase tracking-wide rounded px-3 py-2 disabled:opacity-50">
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

```javascript{7,9}
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

```javascript{5,11,13-22,25,27-29,35-39,65}
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

```javascript{6-18}
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

```javascript{5,23-24,28}
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
> There's always a tradeoff when creating mock data—it greatly simplifies testing by not having to rely on the entire GraphQL stack, but that means if you want it to be as accurate as the real thing you basically need to _re-write the real thing in your mock_. In this case, leaving out the `postId` was a one-time fix so it's probably not worth going through the work of creating a story/mock/test that simulates what would happen if we left it off.
>
> But, if **CommentForm** ended up being a component that was re-used throughout your application, or the code itself will go through a lot of churn because other developers will constantly be making changes to it, it might be worth investing the time to make sure the interface (the props passed to it and the expected return) are exactly what you want them to be.

First let's pass the post's ID as a prop to **CommentForm**:

```javascript{16}
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

```javascript{3,7}
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

Yay! It would have been nicer if that comment appeared as soon as we submitted the comment, so maybe that's a half-yay? Also, the text boxes stayed filled with our name/messages which isn't idea. But, we can fix both of those! One involves telling the GraphQL client (Apollo) that we created a new record and, if it would be so kind, to try the query again that gets the comments for this page, and we'll fix the other by just removing the form from the page completely when a new comment is submitted.

### GraphQL Query Caching

Much has been written about the [complexities](https://medium.com/swlh/how-i-met-apollo-cache-ee804e6485e9) of [Apollo](https://medium.com/@galen.corey/understanding-apollo-fetch-policies-705b5ad71980) [caching](https://levelup.gitconnected.com/basics-of-caching-data-in-graphql-7ce9489dac15), but for the sake of brevity (and sanity) we're going to do the easiest thing that works, and that's tell Apollo to just re-run the query that shows comments in the cell, known as "refetching."

Along with the variables you pass to a mutation function (`createComment` in our case) there's an option named `refetchQueries` where you pass an array of queries that should be re-run because, presumably, the data you just mutated is reflected in the result of those queries. In our case there's a single query, the **QUERY** export of **CommentsCell**. We'll import that at the top of **CommentForm** (and rename so it's clear what it is to the rest of our code) and then pass it along to the `refetchQueries` option:

```javascript{12,17-19}
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

```javascript{13,20-22,31,33-39,41}
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

Remember our foreshadowing callout a few pages back, wondering if our `comments()` service which only returns _all_ comments could come back to bite us? It finally has: when we get the comments for a post we're not actually getting them for only that post. We're ignoring the `postId` completely and just returning _all_ comments in the database! Turns out the old axiom is true: computers only do exactly what you tell them to do. :(

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

Open up the **comments** service test and let's update it expect the `postId` argument to be passed to the `comments()` function like we tested out in the console:

```javascript{4}
// api/src/services/comments/comments.test.js

scenario('returns all comments', async (scenario) => {
  const result = await comments({ postId: scenario.comment.jane.postId })
  expect(result.length).toEqual(Object.keys(scenario.comment).length)
})
```

When the test suite runs everything will still pass. Javascript won't care if you're passing an argument all of a sudden (although if you were using Typescript you will actually get an error at this point!). In TDD you generally want to get your test to fail before adding code to the thing you're testing which will then cause the test to pass. What's something in this test that will be different once we're only returning _some_ comments? How about the number of comments expected to be returned?

Based on our current scenario, each comment will also get associated with its own, unique post. So of the two comments in our scenario, only one should be returned for a given `postId`:

```javascript{5}
// api/src/services/comments/comments.test.js

scenario('returns all comments from the database', async (scenario) => {
  const result = await comments({ postId: scenario.comment.jane.postId })
  expect(result.length).toEqual(1)
})
```

Now it should fail! Before we get it passing again, let's also change the name of the test to reflect what it's actually testing:

```javascript{3}
// api/src/services/comments/comments.test.js

scenario('returns all comments for a single post from the database', async (scenario) => {
  const result = await comments({ postId: scenario.comment.jane.postId })
  expect(result.length).toEqual(1)
})
```

Okay, open up the actual `comments.js` service and we'll update it to accept the `postId` argument and use it as an option to `findMany()`:

```javascript{3,4}
// api/src/services/comments/comments.js

export const comments = ({ postId }) => {
  return db.comment.findMany({ where: { postId } })
}
```

Save that and the test should pass again!

#### Updating GraphQL

Next we need to let GraphQL know that it should expect a `postId` to be passed for the `comments` query, and it's required (we don't currently have any view that allows you see all comments everywhere so we can ask that it always be present):

```javascript{4}
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

```javascript{18}
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

```javascript{4,5}
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

```javascript{7}
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

## Role-Based Authorization Control (RBAC)

Imagine a few weeks in the future of our blog when every post hits the front page of the New York Times and we're getting hundreds of comments a day. We can't be expected to come up with quality content each day _and_ moderate the endless stream of (mostly well-meaning) comments! We're going to need help. Let's hire a comment moderator to remove obvious spam and bad intentioned posts and help make the internet a better place.

We already have a login system for our blog (Netlify Identity, if you followed the first tutorial), but right now it's all-or-nothing: you either get access to create blog posts, or you don't. In this case our comment moderator(s) will need logins so that we know who they are, but we're not going let them create new blog posts. We need some kind of role that we can give to our two kinds of users so we can distinguish them from one another.

Enter role-based authorization control, thankfully shortened to the common phrase **RBAC**. Authentication says who the person is, authorization says what they can do. Currently the blog has the lowest common denominator of authorization: if they are logged in, they can do everything. Let's add a "less than everything, but more than nothing" level.

### Defining Roles

If you remember back in the first part of the tutorial we actually [pointed out](/tutorial/authentication#authentication-generation) that Netlify Identity provides an optional array of roles that you can attach to a user. That's exactly what we need!

> **What about other auth providers besides Netlify?**
>
> Some auth providers have a similar data structure that you can attach to a user, but if not you'll need to rely on your own database to store their roles. Read more in the [RBAC Cookbook](/cookbook/role-based-access-control-rbac.html#roles-from-a-database).

If you started with your own blog code from Part 1 of the tutorial and already have it deployed on Netlify, you're ready to continue! If you cloned the [redwood-tutorial](https://github.com/redwoodjs/redwood-tutorial) code from GitHub you'll need to [create a Netlify site and deploy it](/tutorial/deployment), then [enable Netlify Identity](/tutorial/authentication#netlify-identity-setup) as described in the first part of the tutorial.

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

> The Plus Trick is a very handy feature of the email standard known as a "boxname", the idea being that you may have other incoming boxes besides one just named "Inbox" and by adding +something to your email address you can specify which box the mail should be sorted into. They don't appear to be in common usage these days, but they are ridiculously helpful for us developers when we're constantly needing new email addresses for testing!
>
> Just append +something to your email address before the @:
>
> - jane.doe+testing@example.com
> - john-doe+sample@example.com

Add your user and then edit them, adding a role of "moderator" in the Roles input box:

![image](https://user-images.githubusercontent.com/300/101226219-9d53eb80-3648-11eb-846e-df0eecb442ba.png)

Edit your original user to have the role "admin":

![image](https://user-images.githubusercontent.com/300/101226249-ba88ba00-3648-11eb-8e83-7b4d17822442.png)

Be sure to accept the invite for your new user and set a password so that you can actually log in as them (if you haven't deployed yet you'll need to copy the `invite_token` from the URL and use it on your local dev web server, as described [here](/tutorial/authentication#accepting-invites)).

If all went well, you should be able to log in as either user with no change in the functionality between them—both can access http://localhost:8910/admin/posts Log in as your moderator user and go there now so we can verify that we get booted out once we add some authorization rules.

### Roles in Routes

The easiest form of RBAC involves locking down entire routes. Let's add one so that only admins can see the admin pages.

In the Router simply add a `role` prop and pass it the name of the role that should be allowed. This prop also [accepts an array](/cookbook/role-based-access-control-rbac#how-to-protect-a-route) if more than one role should have access:

```javascript{12}
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

```javascript{3,12-17,28-36}
// web/src/components/Comment/Comment.js

import { useAuth } from '@redwoodjs/auth'

const formattedDate = (datetime) => {
  const parsedDate = new Date(datetime)
  const month = parsedDate.toLocaleString('en-US', { month: 'long' })
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

```javascript{4-5,13-19,23-30,33-35}
// web/src/components/Comment/Comment.js

import { useAuth } from '@redwoodjs/auth'
import { useMutation } from '@redwoodjs/web'
import { QUERY as CommentsQuery } from 'src/components/CommentsCell'

const formattedDate = (datetime) => {
  const parsedDate = new Date(datetime)
  const month = parsedDate.toLocaleString('en-US', { month: 'long' })
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

```javascript{11}
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

```javascript{5,19-31}
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

```javascript{4-6}
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

`mockCurrentUser()` accepts an object and you can put whatever you want in there (it should be similar to what you return in `getCurrentUser()` in `api/src/lib/auth.js`). But since we want `hasRole()` to work properly then the object _must_ have a `roles` key that is an array of strings.

Check out **Comment** in Storybook and you should see two stories for Comment, one with a "Delete" button and one without!

![image](https://user-images.githubusercontent.com/300/102554392-99c55900-4079-11eb-94cb-78ee12d72577.png)

### Mocking currentUser for Jest

We can use the same `mockCurrentUser()` function in our Jest tests as well. Let's check that the word "Delete" is present in the component's output when the user is a moderator, and that it's not present if the user has any other role (or no role):

```javascript{3,6-10,24-37}
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

```javascript{4,9}
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

```javascript{}
// api/src/services/comments/comments.test.js

scenario('deletes a comment', async (scenario) => {
  mockCurrentUser({ roles: ['moderator'] })

  const comment = await deleteComment({
    id: scenario.comment.jane.id,
  })
  expect(comment.id).toEqual(scenario.comment.jane.id)

  expect(
    await db.comment.findUnique({ where: { id: scenario.comment.jane.id } })
  ).toEqual(null)
})
```

Our first expectation here checks that we get the deleted comment back from a call to `deleteComment()`. The second expectation make sure that the comment was actually removed from the database: trying to find a comment with that `id` now returns `null`.

### Last Word on Roles

Having a role like "admin" implies that they can do everything...shouldn't they be able to delete comments as well? Right you are! There are two things we can do here:

1. Add "admin" to the list of roles in the `hasRole()` and `requireAuth()` function calls
2. In addition to "admin", also give the "moderator" role to those users in Netlify Identity

By virtue of the name "admin" it really feels like someone should only have that one single roll and be able to do everything. So in this case it feels better to add "admin" to `hasRole()` and `requireAuth()`.

But if you wanted to be more fine-grained with your roles then maybe the "admin" role should really be called "author". That way it makes it clear they only author posts, and if you want someone to be able to do both actions you can explicitly give them the "moderator" role in addition to "author."

Managing roles can be a tricky thing to get right. Spend a little time up front thinking about how they'll interact and how much duplication you're willing to accept in your role-based function calls on the site. If you see yourself constantly adding multiple roles to `hasRole()` that may be an indication that it's time to add a single, new role that includes those abilities and remove that duplication in your code.

## Wrapping up

You made it! Again! In Part 1 of the tutorial we learned about a lot of features that make it easier to create functionality for your users—cells, forms, scaffolding, and more. In Part 2 we learned more about the features that make life easier for us, the developers: Storybook and testing.

Testing is like wearing a seat belt: 99% of the time may not see any direct benefits, but that other 1% of the time you're _really_ glad you were wearing it. The first time your build stops and prevents some production-crashing bug from going live you'll know that all those hours you spent writing tests were worth it. Getting into the habit of writing tests along with your user-facing code is the greatest gift you can give your future developer self (that, and writing good comments!).

Will there be a Part 3 of the tutorial? It's a fact that the best things come in threes: Lord of the Rings movies, sides of a triangle, and Super Mario Bros. games on the NES. We've spent a lot of time getting our features working but not much time with optimization and polish. [Premature optimization is the root of all evil](http://wiki.c2.com/?PrematureOptimization), but once your site is live and you've got real users on it you'll get a sense of what could be faster, prettier or more efficient. That's when time spent optimizing can pay huge dividends. But, discovering the techniques and best practices for those optimizations...that's a whole different story. The kind of story that Redwood loves to help you write!

So until next time, a bit of wisdom to help combat that next bout of every developer's nemesis, imposter syndrome:

<div class="font-serif italic font-light">
"There is nothing noble in being superior to your fellow man; true nobility is being superior to your former self." — Ernest Hemingway
</div>

### What's Next

Want to add some more features to your app? Check out some of our Cookbook recipes like [calling to a third party API](/cookbook/using-a-third-party-api) and [deploying an app without an API at all](/cookbook/disable-api-database). We've also got lots of [guides](/docs/introduction) for more info on Redwood's internals.

### Roadmap

Check out our [Roadmap](https://redwoodjs.com/roadmap) to see where we're headed and how we're going to get there. If you're interested in helping with anything you see, just let us know over on the [RedwoodJS Forum](https://community.redwoodjs.com/) and we'll be happy to get you set up. We want to hit `1.0` by Redwood's first birthday in March 2021. And with your help, we think we can do it!

### Help Us!

What do you think of Redwood? Is it the Next Step for JS frameworks? What can it do better? We've got a lot more planned. Want to help us build these upcoming features?

- [Open a PR](https://github.com/redwoodjs/redwood/pulls)
- [Write some docs](/docs/introduction)
- [Join the community](https://community.redwoodjs.com)

Thanks for following along. Now go out and build something amazing!
