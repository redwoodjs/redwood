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
