type PossibleTypesResult = {
    possibleTypesFiles: string[];
    errors: {
        message: string;
        error: unknown;
    }[];
};
/**
 * Generate possible types from fragments and union types
 *
 * In order to use fragments with unions and interfaces in Apollo Client,
 * you need to tell the client how to discriminate between the different
 * types that implement or belong to a supertype.
 *
 * You pass a possibleTypes option to the InMemoryCache constructor
 * to specify these relationships in your schema.
 *
 * This object maps the name of an interface or union type (the supertype)
 * to the types that implement or belong to it (the subtypes).
 *
 * For example:
 *
 * ```ts
 * possibleTypes: {
 *  Character: ["Jedi", "Droid"],
 *  Test: ["PassingTest", "FailingTest", "SkippedTest"],
 *  Snake: ["Viper", "Python"],
 *  Groceries: ['Fruit', 'Vegetable'],
 * },
 * ```
 *
 * @see https://www.apollographql.com/docs/react/data/fragments/#using-fragments-with-unions-and-interfaces
 **/
export declare const generatePossibleTypes: () => Promise<PossibleTypesResult>;
export {};
//# sourceMappingURL=possibleTypes.d.ts.map