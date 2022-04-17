import gql from "graphql-tag";
export const schema = gql`
  type Todo {
    id: Int!
    body: String!
    status: String!
  }

  type Query {
    todos: [Todo] @skipAuth
    todosCount: Int! @skipAuth
  }

  type Mutation {
    createTodo(body: String!): Todo @skipAuth
    updateTodoStatus(id: Int!, status: String!): Todo @skipAuth
    renameTodo(id: Int!, body: String!): Todo @skipAuth
  }
`;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL2FwaS9zcmMvZ3JhcGhxbC90b2Rvcy5zZGwuanMiXSwibmFtZXMiOlsiZ3FsIiwic2NoZW1hIl0sIm1hcHBpbmdzIjoiT0FBc0JBLEc7QUFBdEIsT0FBTyxNQUFNQyxNQUFNLEdBQUdELEdBQUk7QUFDMUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQWpCTyIsInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBjb25zdCBzY2hlbWEgPSBncWxgXG4gIHR5cGUgVG9kbyB7XG4gICAgaWQ6IEludCFcbiAgICBib2R5OiBTdHJpbmchXG4gICAgc3RhdHVzOiBTdHJpbmchXG4gIH1cblxuICB0eXBlIFF1ZXJ5IHtcbiAgICB0b2RvczogW1RvZG9dIEBza2lwQXV0aFxuICAgIHRvZG9zQ291bnQ6IEludCEgQHNraXBBdXRoXG4gIH1cblxuICB0eXBlIE11dGF0aW9uIHtcbiAgICBjcmVhdGVUb2RvKGJvZHk6IFN0cmluZyEpOiBUb2RvIEBza2lwQXV0aFxuICAgIHVwZGF0ZVRvZG9TdGF0dXMoaWQ6IEludCEsIHN0YXR1czogU3RyaW5nISk6IFRvZG8gQHNraXBBdXRoXG4gICAgcmVuYW1lVG9kbyhpZDogSW50ISwgYm9keTogU3RyaW5nISk6IFRvZG8gQHNraXBBdXRoXG4gIH1cbmBcbiJdfQ==