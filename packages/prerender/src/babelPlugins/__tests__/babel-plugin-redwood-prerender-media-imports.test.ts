import path from 'path'

import pluginTester from 'babel-plugin-tester'

import plugin from '../babel-plugin-redwood-prerender-media-imports'

const mockDistDir = path.resolve(__dirname, './__fixtures__/distDir')

jest.mock('@redwoodjs/internal', () => {
  return {
    ...jest.requireActual('@redwoodjs/internal'),
    getPaths: () => {
      return {
        web: {
          dist: mockDistDir,
        },
      }
    },
  }
})

describe('Should replace larger imports based on generated manifest', () => {
  pluginTester({
    plugin,
    pluginName: 'babel-plugin-redwood-prerender-media-imports',
    tests: [
      {
        title: 'Handle jpgs',
        code: `import img1 from './image1.jpg'`,
        output: `const img1 = '/static/media/myImageOne.hash.jpg'`,
      },
      {
        title: 'Handle jpegs',

        code: `import img2 from './image2.jpeg'`,
        output: `const img2 = '/static/media/myImageTwo.hash.jpeg'`,
      },
      {
        title: 'Handle pngs',

        code: `import img3 from './image3.png'`,
        output: `const img3 = '/static/media/myImageThree.hash.png'`,
      },
      {
        title: 'Handle bmps',
        code: `import img4 from './image4.bmp'`,
        output: `const img4 = '/static/media/myImageFour.hash.bmp'`,
      },
      {
        title: 'Handle pdfs',

        code: `import pdfDoc from './terms.pdf'`,
        output: `const pdfDoc = '/static/media/terms.pdf'`,
      },
      {
        title: 'Handle gifs',
        code: `import nyanCat from './nyan.gif'`,
        output: `const nyanCat = '/static/media/nyanKitty.gif'`,
      },
    ],
  })

  afterAll(() => {
    jest.clearAllMocks()
  })
})

describe('Should replace small img sources with blank data url', () => {
  // These imports aren't in the manifest
  // which simulates that they were handled by the url loader
  pluginTester({
    plugin,
    // disable formatter for this test
    formatResult: (r) => r,
    pluginName: 'babel-plugin-redwood-prerender-media-imports',
    tests: [
      {
        title: 'Url loaded image',
        code: `import img1 from './small.jpg'`,
        output: `const img1 = "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==";`,
      },
    ],
  })

  afterAll(() => {
    jest.clearAllMocks()
  })
})
