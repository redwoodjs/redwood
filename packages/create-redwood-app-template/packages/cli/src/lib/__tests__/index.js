describe('addRoutesToRouterTask', () => {
  beforeEach(() => {})

  // import someModule from './someModule.js';

  // it('function1 calls function 2', () => {
  //     someModule.function2 = jest.fn();

  //     someModule.function1(...);

  //     expect(someModule.function2).toHaveBeenCalledWith(...);
  // });

  // `<Route path="${path}" page={${pascalcase(name)}Page} name="${camelcase(
  //   name
  // )}" />`,

  it('Does not add routes twice', () => {
    jest.mock('../index', () => {
      const originalLib = require.requireActual('../index')

      return {
        ...originalLib,
        readFile: () => {},
        writeFile: () => {},
      }
    })
    const { addRoutesToRouterTask } = require.requireMock('../index')

    addRoutesToRouterTask('I am a route')
  })
})
