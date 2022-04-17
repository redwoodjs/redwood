import { createValidatorDirective } from '@redwoodjs/graphql-server';
import { requireAuth as applicationRequireAuth } from "../../lib/auth";
export const schema = {
  "kind": "Document",
  "definitions": [{
    "kind": "DirectiveDefinition",
    "name": {
      "kind": "Name",
      "value": "requireAuth"
    },
    "arguments": [{
      "kind": "InputValueDefinition",
      "name": {
        "kind": "Name",
        "value": "roles"
      },
      "type": {
        "kind": "ListType",
        "type": {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "String"
          }
        }
      },
      "directives": []
    }],
    "repeatable": false,
    "locations": [{
      "kind": "Name",
      "value": "FIELD_DEFINITION"
    }]
  }],
  "loc": {
    "start": 0,
    "end": 63,
    "source": {
      "body": "\n  directive @requireAuth(roles: [String]) on FIELD_DEFINITION\n",
      "name": "GraphQL request",
      "locationOffset": {
        "line": 1,
        "column": 1
      }
    }
  }
};

const validate = ({
  directiveArgs
}) => {
  const {
    roles
  } = directiveArgs;
  applicationRequireAuth({
    roles
  });
};

const requireAuth = createValidatorDirective(schema, validate);
export default requireAuth;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL2FwaS9zcmMvZGlyZWN0aXZlcy9yZXF1aXJlQXV0aC9yZXF1aXJlQXV0aC5qcyJdLCJuYW1lcyI6WyJjcmVhdGVWYWxpZGF0b3JEaXJlY3RpdmUiLCJyZXF1aXJlQXV0aCIsImFwcGxpY2F0aW9uUmVxdWlyZUF1dGgiLCJzY2hlbWEiLCJ2YWxpZGF0ZSIsImRpcmVjdGl2ZUFyZ3MiLCJyb2xlcyJdLCJtYXBwaW5ncyI6IkFBRUEsU0FBU0Esd0JBQVQsUUFBeUMsMkJBQXpDO0FBRUEsU0FBU0MsV0FBVyxJQUFJQyxzQkFBeEI7QUFFQSxPQUFPLE1BQU1DLE1BQU07QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLENBQVo7O0FBSVAsTUFBTUMsUUFBUSxHQUFHLENBQUM7QUFBRUMsRUFBQUE7QUFBRixDQUFELEtBQXVCO0FBQ3RDLFFBQU07QUFBRUMsSUFBQUE7QUFBRixNQUFZRCxhQUFsQjtBQUNBSCxFQUFBQSxzQkFBc0IsQ0FBQztBQUFFSSxJQUFBQTtBQUFGLEdBQUQsQ0FBdEI7QUFDRCxDQUhEOztBQUtBLE1BQU1MLFdBQVcsR0FBR0Qsd0JBQXdCLENBQUNHLE1BQUQsRUFBU0MsUUFBVCxDQUE1QztBQUVBLGVBQWVILFdBQWYiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZ3FsIGZyb20gJ2dyYXBocWwtdGFnJ1xuXG5pbXBvcnQgeyBjcmVhdGVWYWxpZGF0b3JEaXJlY3RpdmUgfSBmcm9tICdAcmVkd29vZGpzL2dyYXBocWwtc2VydmVyJ1xuXG5pbXBvcnQgeyByZXF1aXJlQXV0aCBhcyBhcHBsaWNhdGlvblJlcXVpcmVBdXRoIH0gZnJvbSAnc3JjL2xpYi9hdXRoJ1xuXG5leHBvcnQgY29uc3Qgc2NoZW1hID0gZ3FsYFxuICBkaXJlY3RpdmUgQHJlcXVpcmVBdXRoKHJvbGVzOiBbU3RyaW5nXSkgb24gRklFTERfREVGSU5JVElPTlxuYFxuXG5jb25zdCB2YWxpZGF0ZSA9ICh7IGRpcmVjdGl2ZUFyZ3MgfSkgPT4ge1xuICBjb25zdCB7IHJvbGVzIH0gPSBkaXJlY3RpdmVBcmdzXG4gIGFwcGxpY2F0aW9uUmVxdWlyZUF1dGgoeyByb2xlcyB9KVxufVxuXG5jb25zdCByZXF1aXJlQXV0aCA9IGNyZWF0ZVZhbGlkYXRvckRpcmVjdGl2ZShzY2hlbWEsIHZhbGlkYXRlKVxuXG5leHBvcnQgZGVmYXVsdCByZXF1aXJlQXV0aFxuIl19