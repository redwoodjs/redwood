import { RedwoodError } from '../errors';
export declare class ServiceValidationError extends RedwoodError {
    constructor(message: string, substitutions?: {});
}
export declare class AbsenceValidationError extends ServiceValidationError {
    constructor(name: string, message?: string, substitutions?: {});
}
export declare class AcceptanceValidationError extends ServiceValidationError {
    constructor(name: string, message?: string, substitutions?: {});
}
export declare class EmailValidationError extends ServiceValidationError {
    constructor(name: string, message?: string, substitutions?: {});
}
export declare class ExclusionValidationError extends ServiceValidationError {
    constructor(name: string, message?: string, substitutions?: {});
}
export declare class FormatValidationError extends ServiceValidationError {
    constructor(name: string, message?: string, substitutions?: {});
}
export declare class InclusionValidationError extends ServiceValidationError {
    constructor(name: string, message?: string, substitutions?: {});
}
export declare class MinLengthValidationError extends ServiceValidationError {
    constructor(name: string, message?: string, substitutions?: {
        min?: number;
    });
}
export declare class MaxLengthValidationError extends ServiceValidationError {
    constructor(name: string, message?: string, substitutions?: {
        max?: number;
    });
}
export declare class EqualLengthValidationError extends ServiceValidationError {
    constructor(name: string, message?: string, substitutions?: {
        equal?: number;
    });
}
export declare class BetweenLengthValidationError extends ServiceValidationError {
    constructor(name: string, message?: string, substitutions?: {
        min?: number;
        max?: number;
    });
}
export declare class PresenceValidationError extends ServiceValidationError {
    constructor(name: string, message?: string, substitutions?: {});
}
export declare class TypeNumericalityValidationError extends ServiceValidationError {
    constructor(name: string, message?: string, substitutions?: {});
}
export declare class IntegerNumericalityValidationError extends ServiceValidationError {
    constructor(name: string, message?: string, substitutions?: {});
}
export declare class LessThanNumericalityValidationError extends ServiceValidationError {
    constructor(name: string, message?: string, substitutions?: {
        lessThan?: number;
    });
}
export declare class LessThanOrEqualNumericalityValidationError extends ServiceValidationError {
    constructor(name: string, message?: string, substitutions?: {
        lessThanOrEqual?: number;
    });
}
export declare class GreaterThanNumericalityValidationError extends ServiceValidationError {
    constructor(name: string, message?: string, substitutions?: {
        greaterThan?: number;
    });
}
export declare class GreaterThanOrEqualNumericalityValidationError extends ServiceValidationError {
    constructor(name: string, message?: string, substitutions?: {
        greaterThanOrEqual?: number;
    });
}
export declare class EqualNumericalityValidationError extends ServiceValidationError {
    constructor(name: string, message?: string, substitutions?: {
        equal?: number;
    });
}
export declare class OtherThanNumericalityValidationError extends ServiceValidationError {
    constructor(name: string, message?: string, substitutions?: {
        otherThan?: number;
    });
}
export declare class EvenNumericalityValidationError extends ServiceValidationError {
    constructor(name: string, message?: string, substitutions?: {});
}
export declare class OddNumericalityValidationError extends ServiceValidationError {
    constructor(name: string, message?: string, substitutions?: {});
}
export declare class PositiveNumericalityValidationError extends ServiceValidationError {
    constructor(name: string, message?: string, substitutions?: {});
}
export declare class NegativeNumericalityValidationError extends ServiceValidationError {
    constructor(name: string, message?: string, substitutions?: {});
}
export declare class CustomValidationError extends ServiceValidationError {
    constructor(name: string, message?: string, substitutions?: {});
}
export declare class UniquenessValidationError extends ServiceValidationError {
    constructor(name: string, message: string | undefined, substitutions?: {});
}
//# sourceMappingURL=errors.d.ts.map