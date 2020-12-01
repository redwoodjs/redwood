import { sep } from 'path'

import { URL_file, URL_toFile } from '../URL'

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

describe('URL_toFile', () => {
  it('works', async () => {
    const res = `${sep}a${sep}b.c`
    expect(URL_toFile(`/a/b.c`)).toEqual(res)
    expect(URL_toFile(`file:///a/b.c`)).toEqual(res)
  })
  it('works with urlencoded windows file URLs (vscode language server does it this way)', () => {
    expect(URL_toFile(`file:///c%3A/a/b.c`, '\\')).toEqual('c:\\a\\b.c')
  })
})
