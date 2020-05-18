# How to mock `@redwoodjs/router`

Place a manual mock in the `web/__mocks__` folder. Jest requires mocks for node_modules to be in the project root. Using the mock provided by `@redwoodjs/testing` will pass tests using `routes.existingRoute()` and fail tests using `routes.nonExistingRoute()`

```javascript
// web/__mocks__/@redwoodjs/router.js
import { routerMock } from '@redwoodjs/testing'

export * from '@redwoodjs/router'
export default routerMock
```

# How to mock API calls

Wrap your subject in `MockedProvider` and mock queries by passing them into it. ([More Info](https://www.apollographql.com/docs/react/development-testing/testing/#mockedprovider))

Example for `BlogPostPage`, a page containing a Cell:

```javascript
import { render, screen, MockedProvider } from '@redwoodjs/testing'

import { QUERY } from 'src/components/BlogPostCell/BlogPostCell'

import BlogPostPage from './BlogPostPage'

describe('BlogPostPage', () => {
  it('renders successfully', async () => {
    const mocks = [
      {
        request: {
          query: QUERY,
          variables: {
            id: 'id-123',
          },
        },
        result: {
          data: {
            post: { title: 'Post Title', id: 'id-123', body: 'Test' },
          },
        },
      },
    ]

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <BlogPostPage id="id-123" />
      </MockedProvider>
    )

    expect(await screen.findByText(/Post Title/)).toBeInTheDocument()
  })
})

```