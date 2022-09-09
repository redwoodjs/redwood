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

// This is used for a specific case where the first param doesnt have a type, but second one does
type AdjacentParams<
  TParam extends string,
  TMatch extends string,
  TRest extends string
> = { [ParamName in TParam]: string } & ParsedParams<`${TRest}:${TMatch}}`> &
  ParsedParams<`${TRest}`>

type TypedParamInFront<
  TParam extends string,
  TMatch extends string,
  TRest extends string
> = TParam extends `${infer Param2}}/${infer Rest2}`
  ? // check for greedy match (basically if the param contains a slash in it)
    // e.g. in {b}/{c:Int} it matches b}/{c as the param
    // Rest2 = {c, Match = Int so we reconstruct the old one {c + : + Int + }
    AdjacentParams<Param2, TMatch, Rest2>
  : // Otherwise its a regular match
    { [Entry in TParam]: ParamType<TMatch> } & ParsedParams<`${TRest}`>

// has type, but at the end e.g. {d:Int}
type TypedParamAtEnd<
  TParam extends string,
  TMatch extends string
> = TParam extends `${infer Param2}}/${infer Rest2}`
  ? { [ParamName in Param2]: string } & ParsedParams<`${Rest2}:${TMatch}}`>
  : { [Entry in TParam]: ParamType<TMatch> }

// no type, but has stuff after it, e.g. {c}/{d}
type NoTypesButParams<TParam extends string, TRest extends string> = {
  [ParamName in TParam]: string
} & ParsedParams<`${TRest}`>

type JustParamNoType<TParam extends string> = { [ParamName in TParam]: string }

// Path string parser for Redwood Routes
type ParsedParams<PartialRoute> =
  // {a:Int}/[...moar]
  PartialRoute extends `{${infer Param}:${infer Match}}/${infer Rest}`
    ? TypedParamInFront<Param, Match, Rest>
    : // has type, but at the end e.g. {d:Int}
    PartialRoute extends `{${infer Param}:${infer Match}}`
    ? // Greedy match order 2
      TypedParamAtEnd<Param, Match>
    : // no type, but has stuff after it, e.g. {c}/{d}
    PartialRoute extends `{${infer Param}}/${infer Rest}`
    ? NoTypesButParams<Param, Rest>
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
  noTypesButParams()
} else if('{d}') {
  justParamNoType()
} else if ('bazinga/..rest') {
  // Call itself
  parseParamsRecursiveCall(rest)
}


{...glob}/...rest // beginning
{...glob} // end
**/
