---
id: our-first-story
title: "Our First Story"
sidebar_label: "Our First Story"
---

Let's say that on our homepage we only want to show the first couple of sentences in our blog post as a short summary, and then you'll have to click through to see the full post.

First let's update the **BlogPost** component to contain that functionality:

```javascript {5-7,9,18}
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

```javascript {5-14,16-18,20-22}
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

```javascript {26}
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
    <div className="space-y-10">
      {posts.map((post) => (
        <BlogPost post={post} summary={true} key={post.id} />
      ))}
    </div>
  )
}
```

![image](https://user-images.githubusercontent.com/300/95525432-f4ab4780-0988-11eb-9e9b-8df6641452ec.png)

And if you head to the real site you'll see the summary there as well:

![image](https://user-images.githubusercontent.com/300/101545160-b2d45880-395b-11eb-9a32-f8cb8106de7f.png)

Storybook makes it easy to create and modify your components in isolation and actually helps enforce a general best practice when building React applications: components should be self-contained and reusable by just changing the props that are sent in.

