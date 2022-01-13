---
id: our-first-test
title: "Our First Test"
sidebar_label: "Our First Test"
---

So if Storybook is the first phase of creating/updating a component, phase two must be confirming the functionality with a test. Let's add a test for our new summary feature.

First let's run the existing suite to see if we broke anything:

```bash
yarn rw test
```

Well that didn't take long! Can you guess what we broke?

![image](https://user-images.githubusercontent.com/300/96655765-1b576f80-12f3-11eb-9e92-0024c19703cc.png)

The test was looking for the full text of the blog post, but remember that in **BlogPostsCell** we had **BlogPost** only display the *summary* of the post. This test is looking for the full text match, which is no longer present on the page.

Let's update the test so that it checks for the expected behavior instead. There are entire books written on the best way to test, so no matter what we decide on testing in this code there will be someone out there to tell us we're doing it wrong. As just one example, the simplest test would be to just copy what's output and use that for the text in the test:

```javascript {7-8}
// web/src/components/BlogPostsCell.test.js

test('Success renders successfully', async () => {
  const posts = standard().posts
  render(<Success posts={posts} />)

  expect(screen.getByText(posts[0].title)).toBeInTheDocument()
  expect(screen.getByText("Neutra tacos hot chicken prism raw denim, put a bird on it enamel pin post-ironic vape cred DIY. Str...")).toBeInTheDocument()
})
```

But the truncatation length could change later, so how do we encapsulate that in our test? Or should we? The number of characters is in the **BlogPost** component, which this component shouldn't know about. Even if we refactored the `truncate()` function into a shared place and imported it into both **BlogPost** and this test, the test will still be knowing too much about **BlogPost**—why should it know the internals of **BlogPost** and that it's making use of this `truncate()` function at all? It shouldn't!

Let's compromise—by virtue of the fact that this functionality has a prop called "summary" we can guess that it's doing *something* to shorten the text. So what if we test three things that we can make reasonable assumptions about right now:

1. The full body of the post body *is not* present
2. But, at least the first couple of words of the post *are* present
3. The text that is shown ends in "..."

This gives us a buffer if we decide to truncate to something like 25 words, or even if we go up to a couple of hundred. What it *doesn't* encompass, however, is the case where the body of the blog post is shorter than the truncate limit. In that case the full text would be present, and we should probably update the `truncate()` function to not add the `...` in that case. We'll leave adding that functionality and test case up to you to add in your free time. ;)

### Adding the Test

Okay, let's do this:

```javascript {27-34}
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
When trying to find the *full* text of the body, it should *not* be present

```javascript
expect(screen.getByText(regex)).toBeInTheDocument()
```
Find the truncated-body-plus-ellipsis somewhere in the page

</div>

As soon as you saved that test file the test should have run and passed! Press `a` to run the whole suite.

> **What's the difference between `getByText()` and `queryByText()`?**
>
> `getByText()` will throw an error if the text isn't found in the document, whereas `queryByText()` will  return `null` and let you continue with your testing (and is one way to test that some text is *not* present on the page). You can read more about these in the [DOM Testing Library Queries](https://testing-library.com/docs/dom-testing-library/api-queries) docs.

To double check that we're testing what we think we're testing, open up `BlogPostsCell.js` and remove the `summary={true}` prop (or set it to `false`)—the test will fail: now the full body of the post *is* on the page and `expect(screen.queryByText(post.body)).not.toBeInTheDocument()` *is* in the document. Make sure to put the `summary={true}` back before we continue!

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

```javascript {1}
export const Success = ({ posts }) => {
  return (
    {posts.map((post) => <BlogPost post={post} />)}
  )
}
```

So we can just spread the result of `standard()` in a story or test when using the **Success** component and everything works out:

```javascript {5}
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

* Export the `truncate()` function and test it directly
* Test the final rendered state of the component

In this case `truncate()` "belongs to" **BlogPost** and the outside world really shouldn't need to worry about it or know that it exists. If we came to a point in development where another component needed to truncate text then that would be a perfect time to move this function to a shared location and import it into both components that need it. `truncate()` could then have its own dedicated test. But for now let's keep our separation of concerns and test the one thing that's "public" about this component—the result of the render.

In this case let's just test that the output matches an exact string. You could spin yourself in circles trying to refactor the code to make it absolutely bulletproof to code changes breaking the tests, but will you ever actually need that level of flexibility? It's always a trade-off!

We'll move the sample post data to a constant and then use it in both the existing test (which tests that not passing the `summary` prop at all results in the full body being rendered) and our new test that checks for the summary version being rendered:

```javascript {6-17,21,23-24,27-37}
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

