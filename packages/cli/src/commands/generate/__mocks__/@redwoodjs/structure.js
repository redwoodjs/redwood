// We need this because we check for typescript automatically in generate

const mockedStructure = {
  ...jest.requireActual('@redwoodjs/structure'),
  getProject: () => {
    return {
      isTypeScriptProject: false,
    }
  },
}

module.exports = mockedStructure
