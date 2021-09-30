# Update Scenarios

|         |                  |
|:--------|:-----------------|
| version | `0.36` -> `0.37` |

Adds the ability to pass [Prisma create options](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#create) to scenarios.

```javascript
// input.js

export const standard = defineScenario({
  user: {
    one: {
      email: 'String4870974',
    },
    two: {
      email: 'String2695864',
    },
  },
})

```

```javascript
// output.js

export const standard = defineScenario({
  user: {
    one: {
      data: {
        email: 'String4076824',
      },
    },
    two: {
      data: {
        email: 'String4185007',
      },
    },
  },
})

```
