export const standard = defineScenario({
  user: {
    one: {
      data: {
        email: 'String4870974',
      },
    },
    two: {
      data: {
        email: 'String2695864',
      },
    },
  },
})

export const myOtherScenario = defineScenario({
  modelOne: {
    foo: {
      data: {
        id: 55,
      },
    },
    barr: {
      data: {
        id: 77,
      },
    },
  },
  modelTwo: {
    one: {
      data: {
        name: 'alice',
      },
    },
    fifteen: {
      data: {
        name: 'esteban',
      },
    },
  },
})
