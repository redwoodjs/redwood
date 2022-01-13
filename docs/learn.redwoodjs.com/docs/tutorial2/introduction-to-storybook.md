---
id: introduction-to-storybook
title: "Introduction to Storybook"
sidebar_label: "Introduction to Storybook"
---

Let's see what this Storybook thing is all about. Run this command to start up the Storybook server (again, you can cancel the test runner and run this in the same session, or start a new one):

```bash
yarn rw storybook
```

After some compiling you should get a message saying that Storybook has started and it's available at http://localhost:7910

![image](https://user-images.githubusercontent.com/300/95522673-8f078d00-0981-11eb-9551-0a211c726802.png)

If you poke around at the file tree on the left you'll see all of the components, cells, layouts and pages we created during the tutorial. Where did they come from? You may recall that every time we generated a new page/cell/component we actually created at least *three* files:

* BlogPost.js
* BlogPost.stories.js
* BlogPost.test.js

> If you generated a cell then you also got a `.mock.js` file (more on those later).

Those `.stories.js` files are what makes the tree on the left side of the Storybook browser possible! From their homepage, Storybook describes itself as:

*"...an open source tool for developing UI components in isolation for React, Vue, Angular, and more. It makes building stunning UIs organized and efficient."*

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
        createdAt: '2020-01-01T12:34:45Z'
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

