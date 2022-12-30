import { NodeFileTraceResult, nodeFileTrace } from '@vercel/nft'
import fse from 'fs-extra'

import { zipDir } from '../../../../../lib'
import { packFunctions } from '../packFunctions'

jest.mock('@redwoodjs/internal/dist', () => ({
  findApiDistFunctions: () => ['glob1', 'glob2'],
  ensurePosixPath: (path: string) => path,
  getPaths: (_dir: string) => ({
    base: 'mock_path',
  }),
}))
jest.mock('@vercel/nft')
jest.mock('fs-extra')
jest.mock('archiver')
jest.mock('../../../../../lib')

const FILE_TRACE_RESULT = {
  fileList: new Set(['file1']),
} as NodeFileTraceResult

afterEach(() => {
  jest.clearAllMocks()
})

beforeEach(() => {
  jest.clearAllMocks()
})

describe('api functions packer', () => {
  it('copys and creates zip of all the api functions in a directory', async () => {
    jest.mocked(nodeFileTrace).mockResolvedValue(FILE_TRACE_RESULT)
    jest.mocked(fse.copy).mockImplementation(async () => {})

    await packFunctions()

    const zipCalls = jest.mocked(zipDir).mock.calls
    const copyCalls = jest.mocked(fse).copy.mock.calls

    expect(zipCalls[0][0]).toEqual('./api/dist/zipball/glob1')
    expect(zipCalls[1][0]).toEqual('./api/dist/zipball/glob2')
    expect(copyCalls[0][0]).toEqual('./file1')
    expect(copyCalls[1][0]).toEqual('./file1')
  })
})
