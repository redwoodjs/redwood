// We need this because we check for typescript automatically in generate

const mockedStructure = {
  ...jest.requireActual('@redwoodjs/structure'),
  getProject: jest.fn(() => {
    return {
      isTypescriptProject: false,
    }
  }),
}

module.exports = mockedStructure
