# Add Directives

|         |                  |
|:--------|:-----------------|
| version | `0.36` -> `0.37` |

Adds the `directives` directory to a Redwood project. Copies from the create-redwood-app template: https://github.com/redwoodjs/redwood/tree/main/packages/create-redwood-app/template/api/src/directives.

```
api
├── src
│   ├── directives
│   │   ├── requireAuth
│   │   ├── requireAuth.test.ts
│   │   │   └── requireAuth.ts
│   │   ├── skipAuth
│   │   │   ├── skipAuth.test.ts
│   │   │   └── skipAuth.ts
```

No jscodeshift is involved.
