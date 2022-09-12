import { A } from 'ts-toolbelt'

type GenericParams = Record<string | number, string | number | boolean>

export type QueryParams = GenericParams

export type RouteParams<Route> = Route extends `${string}/${infer Rest}`
  ? A.Compute<ParsedParams<Rest>>
  : GenericParams

export type ParamType<match> = match extends 'Int'
  ? number
  : match extends 'Boolean'
  ? boolean
  : match extends 'Float'
  ? number
  : string

// This is used for a specific case where the first param
// doesnt have a type, but second one does
// See comment above it's usage
type ParamsFromGreedyMatch<
  TParam extends string,
  TMatch extends string,
  TRest extends string
> = {
  [ParamName in TParam as RemoveGlobDots<ParamName>]: string
} & ParsedParams<`${TRest}:${TMatch}}`> &
  ParsedParams<`${TRest}`>

// Note that this has to be first in the list, because it does greedy param checks
type TypedParamInFront<
  TParam extends string,
  TMatch extends string,
  TRest extends string
> = TParam extends `${infer Param2}}/${infer Rest2}`
  ? // check for greedy match (basically if the param contains a slash in it)
    // e.g. in {b}/{c:Int} it matches b}/{c as the param
    // Rest2 = {c, Match = Int so we reconstruct the old one {c + : + Int + }
    ParamsFromGreedyMatch<Param2, TMatch, Rest2>
  : // Otherwise its a regular match
    {
      [ParamName in TParam]: ParamType<TMatch>
    } & ParsedParams<`${TRest}`>

// This is the second part of greedy match
// has type, but at the end e.g. {d:Int} or d:Int} <-- no opening brace
// Needs to be right after TypedParamInFront
type TypedParamAtEnd<
  TParam extends string,
  TMatch extends string
> = TParam extends `${infer Param2}}/${infer Rest2}`
  ? {
      [ParamName in Param2]: string
    } & ParsedParams<`${Rest2}:${TMatch}}`>
  : { [ParamName in TParam]: ParamType<TMatch> }

// This mapper takes a param name and will remove dots if its a glob
// e.g. fromDate... -> fromDate
// Only used when the param doesn't have a type, because glob params dont have types
type RemoveGlobDots<Param> = Param extends `${infer GlobParamName}...`
  ? GlobParamName
  : Param

// no type, but has stuff after it, e.g. {c}/{d} or {c}/bazinga
type MultiParamsWithoutType<TParam extends string, TRest extends string> = {
  [ParamName in TParam as RemoveGlobDots<ParamName>]: string
} & ParsedParams<`${TRest}`>

type JustParamNoType<TParam extends string> = {
  [ParamName in TParam as RemoveGlobDots<ParamName>]: string
}

// Path string parser for Redwood Routes
type ParsedParams<PartialRoute> =
  // PartialRoute extends `{${infer GlobParam}...}/${infer Rest}}`
  //   ? ParsedParams<GlobParam> & ParsedParams<Rest>
  //   : // {a:Int}/[...moar]
  PartialRoute extends `{${infer Param}:${infer Match}}/${infer Rest}`
    ? TypedParamInFront<Param, Match, Rest>
    : // has type, but at the end e.g. {d:Int}
    PartialRoute extends `{${infer Param}:${infer Match}}`
    ? // Greedy match order 2
      TypedParamAtEnd<Param, Match>
    : // no type, but has stuff after it, e.g. {c}/{d} or {c}/bazinga
    PartialRoute extends `{${infer Param}}/${infer Rest}`
    ? MultiParamsWithoutType<Param, Rest>
    : // last one with no type e.g. {d} - just a param
    PartialRoute extends `{${infer Param}}`
    ? JustParamNoType<Param>
    : // if theres a non param
    PartialRoute extends `${string}/${infer Rest}`
    ? ParsedParams<`${Rest}`>
    : // Fallback when doesn't match any of these
      Record<string | number, any>

/**
 * Translation in pseudocode without ternaries
 *
if ('{c:Int}/...rest') {
  checkForGreedyMatch()
} else if ('{c:Int}') {
  typedParamAtEnd()
} else if ('{c}/...rest') {
  multipleParamsNoTypes()
} else if('{d}') {
  justParamNoType()
} else if ('bazinga/..rest') {
  // Call itself
  parseParamsRecursiveCall(rest)
}


{...glob}/...rest // beginning
{...glob} // end
**/
