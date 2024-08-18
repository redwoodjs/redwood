import { PrismaClient } from '@prisma/client';
type WithOptionalMessage<T = Record<string, unknown>> = T & {
    /**
     * A message to be shown if the validation fails.
     */
    message?: string;
};
type WithRequiredMessage<T = Record<string, unknown>> = Required<WithOptionalMessage> & T;
interface AbsenceValidatorOptions extends WithOptionalMessage {
    /**
     * Will count an empty string as being absent (that is, null, undefined and "" will pass this validation)
     */
    allowEmptyString?: boolean;
}
interface AcceptanceValidatorOptions extends WithOptionalMessage {
    /**
     * An array of values that, if any match, will pass the validation.
     */
    in?: unknown[];
}
type EmailValidatorOptions = WithOptionalMessage;
interface ExclusionValidatorOptions extends WithOptionalMessage {
    /**
     * The list of values that cannot be used.
     */
    in?: unknown[];
    caseSensitive?: boolean;
}
interface FormatValidatorOptions extends WithOptionalMessage {
    /**
     * The regular expression to use.
     */
    pattern?: RegExp;
}
interface InclusionValidatorOptions extends WithOptionalMessage {
    /**
     * The list of values that can be used.
     */
    in?: unknown[];
    caseSensitive?: boolean;
}
interface LengthValidatorOptions extends WithOptionalMessage {
    /**
     * Must be at least this number of characters long.
     */
    min?: number;
    /**
     * Must be no more than this number of characters long.
     */
    max?: number;
    /**
     * Must be exactly this number of characters long.
     */
    equal?: number;
    /**
     * Convenience syntax for defining min and max as an array
     *
     * @example
     * validate(input.title, 'Title', {
     *  length: { between: [2, 255] }
     * })
     */
    between?: number[];
}
interface NumericalityValidatorOptions extends WithOptionalMessage {
    /**
     * The number must be an integer.
     */
    integer?: boolean;
    /**
     * The number must be less than the given value.
     */
    lessThan?: number;
    /**
     * The number must be less than or equal to the given value.
     */
    lessThanOrEqual?: number;
    /**
     * The number must be greater than the given value.
     */
    greaterThan?: number;
    /**
     * The number must be greater than or equal to the given number.
     */
    greaterThanOrEqual?: number;
    /**
     * The number must be equal to the given number.
     */
    equal?: number;
    /**
     * The number must not be equal to the given number.
     */
    otherThan?: number;
    /**
     * The number must be even.
     */
    even?: boolean;
    /**
     * The number must be odd.
     */
    odd?: boolean;
    /**
     * The number must be positive.
     */
    positive?: boolean;
    /**
     * The number must be negative.
     */
    negative?: boolean;
}
interface PresenceValidatorOptions extends WithOptionalMessage {
    /**
     * Whether or not to allow null to be considered present.
     *
     * @default false
     */
    allowNull?: boolean;
    /**
     * Whether or not to allow undefined to be considered present.
     *
     * @default false
     */
    allowUndefined?: boolean;
    /**
     * Whether or not to allow an empty string "" to be considered present.
     *
     * @default false
     */
    allowEmptyString?: boolean;
}
interface CustomValidatorOptions extends WithOptionalMessage {
    /**
     * A function which should either throw or return nothing
     */
    with: () => void;
}
interface UniquenessValidatorOptions extends WithOptionalMessage {
    db?: PrismaClient;
}
interface ValidationRecipe {
    /**
     * Requires that a field NOT be present, meaning it must be `null` or `undefined`.
     *
     * Opposite of the [`presence`](https://redwoodjs.com/docs/services.html#presence) validator.
     */
    absence?: boolean | AbsenceValidatorOptions;
    /**
     * Requires that the passed value be `true`, or within an array of allowed values that will be considered "true".
     */
    acceptance?: boolean | AcceptanceValidatorOptions;
    /**
     * Requires that the value be formatted like an email address by comparing against a regular expression.
     * The regex is extremely lax: `/^[^@\s]+@[^.\s]+\.[^\s]+$/`
     *
     * This says that the value:
     *
     * * Must start with one or more characters that aren't a whitespace or literal @
     * * Followed by a @
     * * Followed by one or more characters that aren't a whitespace or literal .
     * * Followed by a .
     * * Ending with one or more characters that aren't whitespace
     *
     * Since the official email regex is around 6,300 characters long, we though this one was good enough.
     * If you have a different, preferred email validation regular expression, use the format validation.
     */
    email?: boolean | EmailValidatorOptions;
    /**
     * Requires that the given value not equal to any in a list of given values.
     *
     * Opposite of the [inclusion](https://redwoodjs.com/docs/services.html#inclusion) validation.
     */
    exclusion?: unknown[] | ExclusionValidatorOptions;
    /**
     * Requires that the value match a given regular expression.
     */
    format?: RegExp | FormatValidatorOptions;
    /**
     * Requires that the given value is equal to one in a list of given values.
     *
     * Opposite of the [exclusion](https://redwoodjs.com/docs/services.html#exclusion) validation.
     */
    inclusion?: unknown[] | InclusionValidatorOptions;
    /**
     * Requires that the value meet one or more of a number of string length validations.
     */
    length?: LengthValidatorOptions;
    /**
     * The awesomely-named Numericality Validation requires that the value passed meet one or more criteria that are all number related.
     */
    numericality?: boolean | NumericalityValidatorOptions;
    /**
     * Requires that a field be present, meaning it must not be null or undefined.
     *
     * Opposite of the [absence](https://redwoodjs.com/docs/services.html#absence) validator.
     */
    presence?: boolean | PresenceValidatorOptions;
    /**
     * Run a custom validation function which should either throw or return nothing.
     * If the function throws an error, the error message will be used as the validation error associated with the field.
     */
    custom?: CustomValidatorOptions;
}
interface ValidationWithMessagesRecipe extends ValidationRecipe {
    absence?: WithRequiredMessage<AbsenceValidatorOptions>;
    acceptance?: WithRequiredMessage<AcceptanceValidatorOptions>;
    email?: WithRequiredMessage<EmailValidatorOptions>;
    exclusion?: WithRequiredMessage<ExclusionValidatorOptions>;
    format?: WithRequiredMessage<FormatValidatorOptions>;
    inclusion?: WithRequiredMessage<InclusionValidatorOptions>;
    length?: WithRequiredMessage<LengthValidatorOptions>;
    numericality?: WithRequiredMessage<NumericalityValidatorOptions>;
    presence?: WithRequiredMessage<PresenceValidatorOptions>;
    custom?: WithRequiredMessage<CustomValidatorOptions>;
}
export declare function validate(value: unknown, labelOrRecipe: ValidationWithMessagesRecipe, recipe?: never): void;
export declare function validate(value: unknown, labelOrRecipe: string, recipe: ValidationRecipe): void;
export declare const validateWithSync: (func: () => void) => void;
export declare const validateWith: (func: () => Promise<any>) => Promise<void>;
export declare function validateUniqueness(model: string, fields: Record<string, unknown>, optionsOrCallback: (tx: PrismaClient) => Promise<any>, callback: never): Promise<any>;
export declare function validateUniqueness(model: string, fields: Record<string, unknown>, optionsOrCallback: UniquenessValidatorOptions, callback?: (tx: PrismaClient) => Promise<any>): Promise<any>;
export {};
//# sourceMappingURL=validations.d.ts.map