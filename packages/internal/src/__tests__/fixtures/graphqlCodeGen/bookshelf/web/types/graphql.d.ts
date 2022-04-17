export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  BigInt: number;
  Date: string;
  DateTime: string;
  JSON: Record<string, unknown>;
  JSONObject: Record<string, unknown>;
  Time: string;
};

export type MUTATION = {
  __typename?: 'Mutation';
  createTodo?: Maybe<TODO>;
  renameTodo?: Maybe<TODO>;
  updateTodoStatus?: Maybe<TODO>;
};


export type MUTATIONCREATETODOARGS = {
  body: Scalars['String'];
};


export type MUTATIONRENAMETODOARGS = {
  body: Scalars['String'];
  id: Scalars['Int'];
};


export type MUTATIONUPDATETODOSTATUSARGS = {
  id: Scalars['Int'];
  status: Scalars['String'];
};

export type QUERY = {
  __typename?: 'Query';
  currentUser?: Maybe<Scalars['JSON']>;
  redwood?: Maybe<REDWOOD>;
  todos?: Maybe<Array<Maybe<TODO>>>;
  todosCount: Scalars['Int'];
};

export type REDWOOD = {
  __typename?: 'Redwood';
  currentUser?: Maybe<Scalars['JSON']>;
  prismaVersion?: Maybe<Scalars['String']>;
  version?: Maybe<Scalars['String']>;
};

export type TODO = {
  __typename?: 'Todo';
  body: Scalars['String'];
  id: Scalars['Int'];
  status: Scalars['String'];
};

export type ADDTODO_CREATETODOMUTATIONVARIABLES = Exact<{
  body: Scalars['String'];
}>;


export type ADDTODO_CREATETODOMUTATION = { __typename?: 'Mutation', createTodo?: { __typename: 'Todo', id: number, body: string, status: string } | null };

export type NUMTODOSCELL_GETCOUNTQUERYVARIABLES = Exact<{ [key: string]: never; }>;


export type NUMTODOSCELL_GETCOUNTQUERY = { __typename?: 'Query', todosCount: number };

export type TODOLISTCELL_GETTODOSQUERYVARIABLES = Exact<{ [key: string]: never; }>;


export type TODOLISTCELL_GETTODOSQUERY = { __typename?: 'Query', todos?: Array<{ __typename?: 'Todo', id: number, body: string, status: string } | null> | null };

export type TODOLISTCELL_CHECKTODOMUTATIONVARIABLES = Exact<{
  id: Scalars['Int'];
  status: Scalars['String'];
}>;


export type TODOLISTCELL_CHECKTODOMUTATION = { __typename?: 'Mutation', updateTodoStatus?: { __typename: 'Todo', id: number, status: string } | null };
