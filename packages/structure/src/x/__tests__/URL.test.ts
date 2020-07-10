import { URL_file } from '../URL'

describe('URL_fromFile', () => {
  it('works for windows style paths', async () => {
    expect(URL_file(`\\a\\b.c`)).toEqual('file:///a/b.c')
    expect(URL_file(`\\a\\b.c`)).toEqual('file:///a/b.c')
    expect(URL_file(`C:\\a`, `b.c`)).toEqual('file:///C:/a/b.c')
  })
  it('works for linux style paths', async () => {
    expect(URL_file(`/a/b.c`)).toEqual('file:///a/b.c')
    expect(URL_file(`/a`, 'b.c')).toEqual('file:///a/b.c')
  })
  it('works with file:// URLs', async () => {
    expect(URL_file('file:///a/b.c')).toEqual('file:///a/b.c')
    expect(URL_file(`file:///a`, 'b.c')).toEqual('file:///a/b.c')
  })
})
