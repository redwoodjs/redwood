import { createValidatorDirective } from '@redwoodjs/graphql-server';
export const schema = {
  "kind": "Document",
  "definitions": [{
    "kind": "DirectiveDefinition",
    "name": {
      "kind": "Name",
      "value": "skipAuth"
    },
    "arguments": [],
    "repeatable": false,
    "locations": [{
      "kind": "Name",
      "value": "FIELD_DEFINITION"
    }]
  }],
  "loc": {
    "start": 0,
    "end": 43,
    "source": {
      "body": "\n  directive @skipAuth on FIELD_DEFINITION\n",
      "name": "GraphQL request",
      "locationOffset": {
        "line": 1,
        "column": 1
      }
    }
  }
};
const skipAuth = createValidatorDirective(schema, () => {
  return;
});
export default skipAuth;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL2FwaS9zcmMvZGlyZWN0aXZlcy9za2lwQXV0aC9za2lwQXV0aC5qcyJdLCJuYW1lcyI6WyJjcmVhdGVWYWxpZGF0b3JEaXJlY3RpdmUiLCJzY2hlbWEiLCJza2lwQXV0aCJdLCJtYXBwaW5ncyI6IkFBRUEsU0FBU0Esd0JBQVQsUUFBeUMsMkJBQXpDO0FBRUEsT0FBTyxNQUFNQyxNQUFNO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLENBQVo7QUFJUCxNQUFNQyxRQUFRLEdBQUdGLHdCQUF3QixDQUFDQyxNQUFELEVBQVMsTUFBTTtBQUN0RDtBQUNELENBRndDLENBQXpDO0FBSUEsZUFBZUMsUUFBZiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBncWwgZnJvbSAnZ3JhcGhxbC10YWcnXG5cbmltcG9ydCB7IGNyZWF0ZVZhbGlkYXRvckRpcmVjdGl2ZSB9IGZyb20gJ0ByZWR3b29kanMvZ3JhcGhxbC1zZXJ2ZXInXG5cbmV4cG9ydCBjb25zdCBzY2hlbWEgPSBncWxgXG4gIGRpcmVjdGl2ZSBAc2tpcEF1dGggb24gRklFTERfREVGSU5JVElPTlxuYFxuXG5jb25zdCBza2lwQXV0aCA9IGNyZWF0ZVZhbGlkYXRvckRpcmVjdGl2ZShzY2hlbWEsICgpID0+IHtcbiAgcmV0dXJuXG59KVxuXG5leHBvcnQgZGVmYXVsdCBza2lwQXV0aFxuIl19