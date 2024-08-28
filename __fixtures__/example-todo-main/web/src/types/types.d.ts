export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
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
