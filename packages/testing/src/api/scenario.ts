import { A } from 'ts-toolbelt'

/**
 * Use this function to define your scenario.
 * @example
 * export const standard = defineScenario({
 user: {
   dom: {
     name: 'Dom Saadi',
     email: 'dom@redwoodjs.com'
    }
  },
})
/* @example
* export const standard = defineScenario<Prisma.CreateUserArgs>({
 user: {
   dom: {
     name: 'Dom Saadi',
     email: 'dom@redwoodjs.com'
    }
  },
})
*/
export const defineScenario: DefineScenario = (data) => {
  return data
}

// -----
// The types below are used to provide global types for scenario and defineScenario, used in testing
// ---

// Note that the generic is **inside** the interface
// This is so we can assign it to a const when we generate scenarios.d.ts
export interface DefineScenario {
  <
    PrismaCreateType extends { data: any },
    ModelName extends string | number | symbol = string | number | symbol,
    KeyName extends string | number | symbol = string | number | symbol
  >(
    scenario: Record<ModelName, Record<KeyName, A.Compute<PrismaCreateType>>>
  ): Record<ModelName, Record<KeyName, A.Compute<PrismaCreateType['data']>>>
}

/**
 * Type of data seeded by the scenario. Use this type to get the 'strict' return type of defineScenario
 *
 * @example
 * import { Product } from '@prisma/client'
 *
 * // If you scenario looks like this:
 * * export const standard = defineScenario({
 *    product: {
 *    shirt: {
 *      id: 55,
 *      price: 10
 *    }
 * })
 *
 * // Export the StandardScenario type as
 * export StandardScenario = ScenarioSeed<Product, 'product'>
 *
 * // You can also define each of the keys in your scenario, so you get stricter type checking
 * export StandardScenario = ScenarioSeed<Product, 'product', 'shirt'>
 *
 */
export type ScenarioData<
  TName extends string | number, // name of the prisma model
  TModel, // the prisma model, imported from @prisma/client
  TKeys extends string | number = string // (optional) each of the keys in your defineScenario e.g. shirt
> = Record<TName, Record<TKeys, TModel>>

interface TestFunctionWithScenario<TData> {
  (scenario?: TData): Promise<void>
}

export interface Scenario {
  (title: string, testFunction: TestFunctionWithScenario<any>): void
}

// Overload scenario function for namedScenario
export interface Scenario {
  (
    namedScenario: string,
    title: string,
    testFunction: TestFunctionWithScenario<any>
  ): void
}

export interface Scenario {
  only: Scenario
}
