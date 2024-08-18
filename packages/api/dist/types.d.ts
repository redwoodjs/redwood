/**
 * Houses utility types commonly used on the api side
 */
import type { O, A } from 'ts-toolbelt';
/**
 * ---- Prisma SDL Type Merge ----
 * SDL is source of truth for KEYS
 * Prisma types is source of truth for VALUES (unless SDL-only field)
 */
type AnyObject = Record<string | symbol | number, unknown>;
type SdlOnlyFields<TPrisma, TSdl> = Omit<TSdl, keyof TPrisma>;
type PrismaTypeWithOptionalKeysFromSdl<TPrisma extends AnyObject, TSdl extends AnyObject> = Pick<TPrisma, O.OptionalKeys<TSdl>>;
type PrismaTypeWithOptionalKeysAndNullableValues<TPrisma extends AnyObject, TSdl extends AnyObject> = {
    [k in keyof PrismaTypeWithOptionalKeysFromSdl<TPrisma, TSdl>]?: PrismaTypeWithOptionalKeysFromSdl<TPrisma, TSdl>[k] | null;
};
type PrismaTypeWithRequiredKeysFromSdl<TPrisma extends AnyObject, TSdl extends AnyObject> = Pick<TPrisma, O.RequiredKeys<TSdl>>;
type OptionalsAndSdlOnly<TPrisma extends AnyObject, TSdl extends AnyObject> = PrismaTypeWithOptionalKeysAndNullableValues<TPrisma, TSdl> & SdlOnlyFields<TPrisma, TSdl>;
export type MakeRelationsOptional<T, TAllMappedModels> = {
    [key in keyof T as T[key] extends TAllMappedModels ? key : never]?: MakeRelationsOptional<T[key], TAllMappedModels>;
} & {
    [key in keyof T as T[key] extends TAllMappedModels ? never : key]: T[key];
};
export type MergePrismaWithSdlTypes<TPrisma extends AnyObject, TSdl extends AnyObject, TAllMappedModels> = A.Compute<OptionalsAndSdlOnly<TPrisma, MakeRelationsOptional<TSdl, TAllMappedModels>> & PrismaTypeWithRequiredKeysFromSdl<TPrisma, MakeRelationsOptional<TSdl, TAllMappedModels>>>;
export {};
//# sourceMappingURL=types.d.ts.map