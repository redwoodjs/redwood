import { Prisma } from "@prisma/client"
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
  JSON: Prisma.JsonValue;
  JSONObject: Prisma.JsonObject;
  Time: string;
};

export type Contact = {
  __typename?: 'Contact';
  createdAt: Scalars['DateTime'];
  email: Scalars['String'];
  id: Scalars['Int'];
  message: Scalars['String'];
  name: Scalars['String'];
};

export type CreateContactInput = {
  email: Scalars['String'];
  message: Scalars['String'];
  name: Scalars['String'];
};

export type CreatePostInput = {
  authorId: Scalars['Int'];
  body: Scalars['String'];
  title: Scalars['String'];
};

export type CreateProduceInput = {
  isPickled?: InputMaybe<Scalars['Boolean']>;
  isSeedless?: InputMaybe<Scalars['Boolean']>;
  name: Scalars['String'];
  nutrients?: InputMaybe<Scalars['String']>;
  price: Scalars['Int'];
  quantity: Scalars['Int'];
  region: Scalars['String'];
  ripenessIndicators?: InputMaybe<Scalars['String']>;
  stallId: Scalars['String'];
  vegetableFamily?: InputMaybe<Scalars['String']>;
};

export type CreateStallInput = {
  name: Scalars['String'];
  stallNumber: Scalars['String'];
};

export type CreateUserInput = {
  email: Scalars['String'];
  fullName: Scalars['String'];
  roles?: InputMaybe<Scalars['String']>;
};

export type Fruit = Grocery & {
  __typename?: 'Fruit';
  id: Scalars['ID'];
  /** Seedless is only for fruits */
  isSeedless?: Maybe<Scalars['Boolean']>;
  name: Scalars['String'];
  nutrients?: Maybe<Scalars['String']>;
  price: Scalars['Int'];
  quantity: Scalars['Int'];
  region: Scalars['String'];
  /** Ripeness is only for fruits */
  ripenessIndicators?: Maybe<Scalars['String']>;
  stall: Stall;
};

export type Groceries = Fruit | Vegetable;

export type Grocery = {
  id: Scalars['ID'];
  name: Scalars['String'];
  nutrients?: Maybe<Scalars['String']>;
  price: Scalars['Int'];
  quantity: Scalars['Int'];
  region: Scalars['String'];
  stall: Stall;
};

export type Mutation = {
  __typename?: 'Mutation';
  createContact?: Maybe<Contact>;
  createPost: Post;
  createProduce: Produce;
  createStall: Stall;
  deleteContact: Contact;
  deletePost: Post;
  deleteProduce: Produce;
  deleteStall: Stall;
  updateContact: Contact;
  updatePost: Post;
  updateProduce: Produce;
  updateStall: Stall;
};


export type MutationcreateContactArgs = {
  input: CreateContactInput;
};


export type MutationcreatePostArgs = {
  input: CreatePostInput;
};


export type MutationcreateProduceArgs = {
  input: CreateProduceInput;
};


export type MutationcreateStallArgs = {
  input: CreateStallInput;
};


export type MutationdeleteContactArgs = {
  id: Scalars['Int'];
};


export type MutationdeletePostArgs = {
  id: Scalars['Int'];
};


export type MutationdeleteProduceArgs = {
  id: Scalars['String'];
};


export type MutationdeleteStallArgs = {
  id: Scalars['String'];
};


export type MutationupdateContactArgs = {
  id: Scalars['Int'];
  input: UpdateContactInput;
};


export type MutationupdatePostArgs = {
  id: Scalars['Int'];
  input: UpdatePostInput;
};


export type MutationupdateProduceArgs = {
  id: Scalars['String'];
  input: UpdateProduceInput;
};


export type MutationupdateStallArgs = {
  id: Scalars['String'];
  input: UpdateStallInput;
};

export type Post = {
  __typename?: 'Post';
  author: User;
  authorId: Scalars['Int'];
  body: Scalars['String'];
  createdAt: Scalars['DateTime'];
  id: Scalars['Int'];
  title: Scalars['String'];
};

export type Produce = {
  __typename?: 'Produce';
  id: Scalars['String'];
  isPickled?: Maybe<Scalars['Boolean']>;
  isSeedless?: Maybe<Scalars['Boolean']>;
  name: Scalars['String'];
  nutrients?: Maybe<Scalars['String']>;
  price: Scalars['Int'];
  quantity: Scalars['Int'];
  region: Scalars['String'];
  ripenessIndicators?: Maybe<Scalars['String']>;
  stall: Stall;
  stallId: Scalars['String'];
  vegetableFamily?: Maybe<Scalars['String']>;
};

/** About the Redwood queries. */
export type Query = {
  __typename?: 'Query';
  contact?: Maybe<Contact>;
  contacts: Array<Contact>;
  fruitById?: Maybe<Fruit>;
  fruits: Array<Fruit>;
  groceries: Array<Groceries>;
  post?: Maybe<Post>;
  posts: Array<Post>;
  produce?: Maybe<Produce>;
  produces: Array<Produce>;
  /** Fetches the Redwood root schema. */
  redwood?: Maybe<Redwood>;
  stall?: Maybe<Stall>;
  stalls: Array<Stall>;
  user?: Maybe<User>;
  vegetableById?: Maybe<Vegetable>;
  vegetables: Array<Vegetable>;
};


/** About the Redwood queries. */
export type QuerycontactArgs = {
  id: Scalars['Int'];
};


/** About the Redwood queries. */
export type QueryfruitByIdArgs = {
  id: Scalars['ID'];
};


/** About the Redwood queries. */
export type QuerypostArgs = {
  id: Scalars['Int'];
};


/** About the Redwood queries. */
export type QueryproduceArgs = {
  id: Scalars['String'];
};


/** About the Redwood queries. */
export type QuerystallArgs = {
  id: Scalars['String'];
};


/** About the Redwood queries. */
export type QueryuserArgs = {
  id: Scalars['Int'];
};


/** About the Redwood queries. */
export type QueryvegetableByIdArgs = {
  id: Scalars['ID'];
};

/**
 * The RedwoodJS Root Schema
 *
 * Defines details about RedwoodJS such as the current user and version information.
 */
export type Redwood = {
  __typename?: 'Redwood';
  /** The current user. */
  currentUser?: Maybe<Scalars['JSON']>;
  /** The version of Prisma. */
  prismaVersion?: Maybe<Scalars['String']>;
  /** The version of Redwood. */
  version?: Maybe<Scalars['String']>;
};

export type Stall = {
  __typename?: 'Stall';
  id: Scalars['String'];
  name: Scalars['String'];
  produce: Array<Maybe<Produce>>;
  stallNumber: Scalars['String'];
};

export type UpdateContactInput = {
  email?: InputMaybe<Scalars['String']>;
  message?: InputMaybe<Scalars['String']>;
  name?: InputMaybe<Scalars['String']>;
};

export type UpdatePostInput = {
  authorId?: InputMaybe<Scalars['Int']>;
  body?: InputMaybe<Scalars['String']>;
  title?: InputMaybe<Scalars['String']>;
};

export type UpdateProduceInput = {
  isPickled?: InputMaybe<Scalars['Boolean']>;
  isSeedless?: InputMaybe<Scalars['Boolean']>;
  name?: InputMaybe<Scalars['String']>;
  nutrients?: InputMaybe<Scalars['String']>;
  price?: InputMaybe<Scalars['Int']>;
  quantity?: InputMaybe<Scalars['Int']>;
  region?: InputMaybe<Scalars['String']>;
  ripenessIndicators?: InputMaybe<Scalars['String']>;
  stallId?: InputMaybe<Scalars['String']>;
  vegetableFamily?: InputMaybe<Scalars['String']>;
};

export type UpdateStallInput = {
  name?: InputMaybe<Scalars['String']>;
  stallNumber?: InputMaybe<Scalars['String']>;
};

export type UpdateUserInput = {
  email?: InputMaybe<Scalars['String']>;
  fullName?: InputMaybe<Scalars['String']>;
  roles?: InputMaybe<Scalars['String']>;
};

export type User = {
  __typename?: 'User';
  email: Scalars['String'];
  fullName: Scalars['String'];
  id: Scalars['Int'];
  posts: Array<Maybe<Post>>;
  roles?: Maybe<Scalars['String']>;
};

export type Vegetable = Grocery & {
  __typename?: 'Vegetable';
  id: Scalars['ID'];
  /** Pickled is only for vegetables */
  isPickled?: Maybe<Scalars['Boolean']>;
  name: Scalars['String'];
  nutrients?: Maybe<Scalars['String']>;
  price: Scalars['Int'];
  quantity: Scalars['Int'];
  region: Scalars['String'];
  stall: Stall;
  /** Veggie Family is only for vegetables */
  vegetableFamily?: Maybe<Scalars['String']>;
};

export type FindAuthorQueryVariables = Exact<{
  id: Scalars['Int'];
}>;


export type FindAuthorQuery = { __typename?: 'Query', author?: { __typename?: 'User', email: string, fullName: string } | null };

export type FindBlogPostQueryVariables = Exact<{
  id: Scalars['Int'];
}>;


export type FindBlogPostQuery = { __typename?: 'Query', blogPost?: { __typename?: 'Post', id: number, title: string, body: string, createdAt: string, author: { __typename?: 'User', email: string, fullName: string } } | null };

export type BlogPostsQueryVariables = Exact<{ [key: string]: never; }>;


export type BlogPostsQuery = { __typename?: 'Query', blogPosts: Array<{ __typename?: 'Post', id: number, title: string, body: string, createdAt: string, author: { __typename?: 'User', email: string, fullName: string } }> };

export type DeleteContactMutationVariables = Exact<{
  id: Scalars['Int'];
}>;


export type DeleteContactMutation = { __typename?: 'Mutation', deleteContact: { __typename?: 'Contact', id: number } };

export type FindContactByIdVariables = Exact<{
  id: Scalars['Int'];
}>;


export type FindContactById = { __typename?: 'Query', contact?: { __typename?: 'Contact', id: number, name: string, email: string, message: string, createdAt: string } | null };

export type FindContactsVariables = Exact<{ [key: string]: never; }>;


export type FindContacts = { __typename?: 'Query', contacts: Array<{ __typename?: 'Contact', id: number, name: string, email: string, message: string, createdAt: string }> };

export type EditContactByIdVariables = Exact<{
  id: Scalars['Int'];
}>;


export type EditContactById = { __typename?: 'Query', contact?: { __typename?: 'Contact', id: number, name: string, email: string, message: string, createdAt: string } | null };

export type UpdateContactMutationVariables = Exact<{
  id: Scalars['Int'];
  input: UpdateContactInput;
}>;


export type UpdateContactMutation = { __typename?: 'Mutation', updateContact: { __typename?: 'Contact', id: number, name: string, email: string, message: string, createdAt: string } };

export type CreateContactMutationVariables = Exact<{
  input: CreateContactInput;
}>;


export type CreateContactMutation = { __typename?: 'Mutation', createContact?: { __typename?: 'Contact', id: number } | null };

export type Fruit_info = { __typename?: 'Fruit', id: string, name: string, isSeedless?: boolean | null, ripenessIndicators?: string | null, stall: { __typename?: 'Stall', id: string, name: string } };

export type EditPostByIdVariables = Exact<{
  id: Scalars['Int'];
}>;


export type EditPostById = { __typename?: 'Query', post?: { __typename?: 'Post', id: number, title: string, body: string, authorId: number, createdAt: string } | null };

export type UpdatePostMutationVariables = Exact<{
  id: Scalars['Int'];
  input: UpdatePostInput;
}>;


export type UpdatePostMutation = { __typename?: 'Mutation', updatePost: { __typename?: 'Post', id: number, title: string, body: string, authorId: number, createdAt: string } };

export type CreatePostMutationVariables = Exact<{
  input: CreatePostInput;
}>;


export type CreatePostMutation = { __typename?: 'Mutation', createPost: { __typename?: 'Post', id: number } };

export type DeletePostMutationVariables = Exact<{
  id: Scalars['Int'];
}>;


export type DeletePostMutation = { __typename?: 'Mutation', deletePost: { __typename?: 'Post', id: number } };

export type FindPostByIdVariables = Exact<{
  id: Scalars['Int'];
}>;


export type FindPostById = { __typename?: 'Query', post?: { __typename?: 'Post', id: number, title: string, body: string, authorId: number, createdAt: string } | null };

export type FindPostsVariables = Exact<{ [key: string]: never; }>;


export type FindPosts = { __typename?: 'Query', posts: Array<{ __typename?: 'Post', id: number, title: string, body: string, authorId: number, createdAt: string }> };

export type Produce_info = { __typename?: 'Produce', id: string, name: string };

export type Stall_info = { __typename?: 'Stall', id: string, name: string };

export type Vegetable_info = { __typename?: 'Vegetable', id: string, name: string, vegetableFamily?: string | null, isPickled?: boolean | null, stall: { __typename?: 'Stall', id: string, name: string } };

export type FindWaterfallBlogPostQueryVariables = Exact<{
  id: Scalars['Int'];
}>;


export type FindWaterfallBlogPostQuery = { __typename?: 'Query', waterfallBlogPost?: { __typename?: 'Post', id: number, title: string, body: string, authorId: number, createdAt: string } | null };
