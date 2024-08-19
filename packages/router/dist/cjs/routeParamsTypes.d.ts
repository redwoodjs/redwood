import type { A } from 'ts-toolbelt';
export type GenericParams = Record<string | number, string | number | boolean>;
export type QueryParams = GenericParams;
export type RouteParams<Route> = Route extends `${string}/${infer Rest}` ? A.Compute<ParsedParams<Rest>> : GenericParams;
export type ParamType<match> = match extends 'Int' ? number : match extends 'Boolean' ? boolean : match extends 'Float' ? number : string;
type ParamsFromGreedyMatch<TParam extends string, TMatch extends string, TRest extends string> = {
    [ParamName in TParam as RemoveGlobDots<ParamName>]: string;
} & ParsedParams<`${TRest}:${TMatch}}`> & ParsedParams<`${TRest}`>;
type TypedParamInFront<TParam extends string, TMatch extends string, TRest extends string> = TParam extends `${infer Param2}}/${infer Rest2}` ? ParamsFromGreedyMatch<Param2, TMatch, Rest2> : // Otherwise its a regular match
{
    [ParamName in TParam]: ParamType<TMatch>;
} & ParsedParams<`${TRest}`>;
type TypedParamAtEnd<TParam extends string, TMatch extends string> = TParam extends `${infer Param2}}/${infer Rest2}` ? {
    [ParamName in Param2]: string;
} & ParsedParams<`${Rest2}:${TMatch}}`> : {
    [ParamName in TParam]: ParamType<TMatch>;
};
type RemoveGlobDots<Param> = Param extends `${infer GlobParamName}...` ? GlobParamName : Param;
type MultiParamsWithoutType<TParam extends string, TRest extends string> = {
    [ParamName in TParam as RemoveGlobDots<ParamName>]: string;
} & ParsedParams<`${TRest}`>;
type JustParamNoType<TParam extends string> = {
    [ParamName in TParam as RemoveGlobDots<ParamName>]: string;
};
type ParsedParams<PartialRoute> = PartialRoute extends `${string}{${infer Param}:${infer Match}}${string}/${infer Rest}` ? TypedParamInFront<Param, Match, Rest> : PartialRoute extends `${string}{${infer Param}:${infer Match}}${string}` ? TypedParamAtEnd<Param, Match> : PartialRoute extends `${string}{${infer Param}}${string}/${infer Rest}` ? MultiParamsWithoutType<Param, Rest> : PartialRoute extends `${string}{${infer Param}}${string}` ? JustParamNoType<Param> : PartialRoute extends `${string}/${infer Rest}` ? ParsedParams<`${Rest}`> : GenericParams;
export {};
/**
 * Translation in pseudocode without ternaries
 *
if ('he{c:Int}lo/...rest') {
  checkForGreedyMatch()
} else if ('he{c:Int}lo') {
  typedParamAtEnd()
} else if ('he{c}yo/...rest') {
  multipleParamsNoTypes()
} else if('he{d}yo') {
  justParamNoType()
} else if ('bazinga/..rest') {
  // Call itself
  parseParamsRecursiveCall(rest)
} else{
  // fallback, because it doesn't match any of the above
  GenericParams
}

Its a bit odd, but the he{d}llo  is a form we support in the router
// e.g. /signedUp/e{status:Boolean}y
**/
//# sourceMappingURL=routeParamsTypes.d.ts.map