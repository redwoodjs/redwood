# Update node engine

In v0.38 we started supporting node 16. That means in the root package json of a redwood app, we need to change the value of the node key of the engines key:

```diff
  {
    "private": true,
    "workspaces": {
      "packages": [
        "api",
        "web",
        "packages/*"
      ]
    },
    "devDependencies": {
      "@redwoodjs/core": "0.37.5"
    },
    "eslintConfig": {
      "extends": "@redwoodjs/eslint-config",
      "root": true
    },
    "engines": {
-     "node": "14.x",
+     "node": ">=14.17 <=16.x",
      "yarn": "1.x"
    },
    "prisma": {
      "seed": "yarn rw exec seed"
    }
  }
```
