/* eslint-disable */
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
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
  Byte: { input: any; output: any; }
  Date: { input: any; output: any; }
  DateTime: { input: any; output: any; }
  File: { input: any; output: any; }
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


export type AddTodo_CreateTodoMutation = { __typename: 'Mutation', createTodo?: { __typename: 'Todo', id: number, body: string, status: string } | null };

export type NumTodosCell_GetCountQueryVariables = Exact<{ [key: string]: never; }>;


export type NumTodosCell_GetCountQuery = { __typename: 'Query', todosCount: number };

export type TodoListCell_GetTodosQueryVariables = Exact<{ [key: string]: never; }>;


export type TodoListCell_GetTodosQuery = { __typename: 'Query', todos?: Array<{ __typename: 'Todo', id: number, body: string, status: string } | null> | null };

export type TodoListCell_CheckTodoMutationVariables = Exact<{
  id: Scalars['Int']['input'];
  status: Scalars['String']['input'];
}>;


export type TodoListCell_CheckTodoMutation = { __typename: 'Mutation', updateTodoStatus?: { __typename: 'Todo', id: number, status: string } | null };


export const AddTodo_CreateTodoDocument = {"__meta__":{"hash":"d67f5d54ba7d2a94e34809f20a0380f9921a5586"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddTodo_CreateTodo"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"body"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"createTodo"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"body"},"value":{"kind":"Variable","name":{"kind":"Name","value":"body"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<AddTodo_CreateTodoMutation, AddTodo_CreateTodoMutationVariables>;
export const NumTodosCell_GetCountDocument = {"__meta__":{"hash":"81a7e7b720f992f8cfcaab15f42cf5a6802ed338"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"NumTodosCell_GetCount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"todosCount"}}]}}]} as unknown as DocumentNode<NumTodosCell_GetCountQuery, NumTodosCell_GetCountQueryVariables>;
export const TodoListCell_GetTodosDocument = {"__meta__":{"hash":"a9d0f2c090ac4320919f631ab0003fcdd2c30652"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TodoListCell_GetTodos"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"todos"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<TodoListCell_GetTodosQuery, TodoListCell_GetTodosQueryVariables>;
export const TodoListCell_CheckTodoDocument = {"__meta__":{"hash":"69a8d2c6640912a8323a729adae2cc2f2f1bdb59"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TodoListCell_CheckTodo"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"status"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"updateTodoStatus"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"status"},"value":{"kind":"Variable","name":{"kind":"Name","value":"status"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<TodoListCell_CheckTodoMutation, TodoListCell_CheckTodoMutationVariables>;