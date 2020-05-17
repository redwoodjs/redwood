# How to mock `@redwoodjs/router`

Place a manual mock in the `web/__mocks__` folder. Jest requires mocks for node_modules to be in the project root. Using the mock provided by `@redwoodjs/testing` will pass tests using `routes.existingRoute()` and fail tests using `routes.nonExistingRoute()`

```javascript
// web/__mocks__/@redwoodjs/router.js
import { routerMock } from '@redwoodjs/testing'

export * from '@redwoodjs/router'
export default routerMock
```