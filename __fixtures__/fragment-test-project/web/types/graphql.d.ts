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

/** About the Redwood queries. */
export type Query = {
  __typename?: 'Query';
  fruitById?: Maybe<Fruit>;
  fruits: Array<Fruit>;
  groceries: Array<Groceries>;
  /** Fetches the Redwood root schema. */
  redwood?: Maybe<Redwood>;
  stallById?: Maybe<Stall>;
  stalls: Array<Stall>;
  vegetableById?: Maybe<Vegetable>;
  vegetables: Array<Vegetable>;
};


/** About the Redwood queries. */
export type QueryfruitByIdArgs = {
  id: Scalars['ID'];
};


/** About the Redwood queries. */
export type QuerystallByIdArgs = {
  id: Scalars['ID'];
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
  fruits?: Maybe<Array<Maybe<Fruit>>>;
  id: Scalars['ID'];
  name: Scalars['String'];
  stallNumber: Scalars['String'];
  vegetables?: Maybe<Array<Maybe<Vegetable>>>;
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

export type GetGroceriesVariables = Exact<{ [key: string]: never; }>;


export type GetGroceries = { __typename?: 'Query', groceries: Array<{ __typename?: 'Fruit', id: string, name: string, isSeedless?: boolean | null, ripenessIndicators?: string | null } | { __typename?: 'Vegetable', id: string, name: string, vegetableFamily?: string | null, isPickled?: boolean | null }> };
