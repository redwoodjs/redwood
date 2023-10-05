/* eslint-disable */
import { DocumentTypeDecoration } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  BigInt: { input: any; output: any; }
  Date: { input: any; output: any; }
  DateTime: { input: any; output: any; }
  JSON: { input: any; output: any; }
  JSONObject: { input: any; output: any; }
  Time: { input: any; output: any; }
};

export type Mutation = {
  __typename?: 'Mutation';
  createTodo?: Maybe<Todo>;
  renameTodo?: Maybe<Todo>;
  updateTodoStatus?: Maybe<Todo>;
};


export type MutationCreateTodoArgs = {
  body: Scalars['String']['input'];
};


export type MutationRenameTodoArgs = {
  body: Scalars['String']['input'];
  id: Scalars['Int']['input'];
};


export type MutationUpdateTodoStatusArgs = {
  id: Scalars['Int']['input'];
  status: Scalars['String']['input'];
};

/** About the Redwood queries. */
export type Query = {
  __typename?: 'Query';
  currentUser?: Maybe<Scalars['JSON']['output']>;
  /** Fetches the Redwood root schema. */
  redwood?: Maybe<Redwood>;
  todos?: Maybe<Array<Maybe<Todo>>>;
  todosCount: Scalars['Int']['output'];
};

/**
 * The RedwoodJS Root Schema
 *
 * Defines details about RedwoodJS such as the current user and version information.
 */
export type Redwood = {
  __typename?: 'Redwood';
  /** The current user. */
  currentUser?: Maybe<Scalars['JSON']['output']>;
  /** The version of Prisma. */
  prismaVersion?: Maybe<Scalars['String']['output']>;
  /** The version of Redwood. */
  version?: Maybe<Scalars['String']['output']>;
};

export type Todo = {
  __typename?: 'Todo';
  body: Scalars['String']['output'];
  id: Scalars['Int']['output'];
  status: Scalars['String']['output'];
};

export type AddTodo_CreateTodoMutationVariables = Exact<{
  body: Scalars['String']['input'];
}>;


export type AddTodo_CreateTodoMutation = { __typename?: 'Mutation', createTodo?: { __typename: 'Todo', id: number, body: string, status: string } | null };

export type NumTodosCell_GetCountQueryVariables = Exact<{ [key: string]: never; }>;


export type NumTodosCell_GetCountQuery = { __typename?: 'Query', todosCount: number };

export type TodoListCell_GetTodosQueryVariables = Exact<{ [key: string]: never; }>;


export type TodoListCell_GetTodosQuery = { __typename?: 'Query', todos?: Array<{ __typename?: 'Todo', id: number, body: string, status: string } | null> | null };

export type TodoListCell_CheckTodoMutationVariables = Exact<{
  id: Scalars['Int']['input'];
  status: Scalars['String']['input'];
}>;


export type TodoListCell_CheckTodoMutation = { __typename?: 'Mutation', updateTodoStatus?: { __typename: 'Todo', id: number, status: string } | null };

export class TypedDocumentString<TResult, TVariables>
  extends String
  implements DocumentTypeDecoration<TResult, TVariables>
{
  __apiType?: DocumentTypeDecoration<TResult, TVariables>['__apiType'];

  constructor(private value: string, public __meta__?: Record<string, any>) {
    super(value);
  }

  toString(): string & DocumentTypeDecoration<TResult, TVariables> {
    return this.value;
  }
}

export const AddTodo_CreateTodoDocument = new TypedDocumentString(`
    mutation AddTodo_CreateTodo($body: String!) {
  createTodo(body: $body) {
    id
    __typename
    body
    status
  }
}
    `, {"hash":"0a10617d10611e708e56d2b72925c82e7415a08a"}) as unknown as TypedDocumentString<AddTodo_CreateTodoMutation, AddTodo_CreateTodoMutationVariables>;
export const NumTodosCell_GetCountDocument = new TypedDocumentString(`
    query NumTodosCell_GetCount {
  todosCount
}
    `, {"hash":"2297bb1d97b9eef1c20733e737683349445c045f"}) as unknown as TypedDocumentString<NumTodosCell_GetCountQuery, NumTodosCell_GetCountQueryVariables>;
export const TodoListCell_GetTodosDocument = new TypedDocumentString(`
    query TodoListCell_GetTodos {
  todos {
    id
    body
    status
  }
}
    `, {"hash":"0e056c245e5b02c609c42dd4c3512699c3d0956e"}) as unknown as TypedDocumentString<TodoListCell_GetTodosQuery, TodoListCell_GetTodosQueryVariables>;
export const TodoListCell_CheckTodoDocument = new TypedDocumentString(`
    mutation TodoListCell_CheckTodo($id: Int!, $status: String!) {
  updateTodoStatus(id: $id, status: $status) {
    id
    __typename
    status
  }
}
    `, {"hash":"74dd5ed40cf06802023b2d536007072ac7d14b14"}) as unknown as TypedDocumentString<TodoListCell_CheckTodoMutation, TodoListCell_CheckTodoMutationVariables>;