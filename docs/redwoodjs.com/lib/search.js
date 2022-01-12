const algoliasearch = require('algoliasearch')
const md5 = require('blueimp-md5')
const marked = require('marked')
const { paramCase } = require('param-case')
const { titleCase } = require('title-case')

let publish
let getObjectIDs

if (process.env['ALGOLIA_APP_ID']) {
  marked.setOptions({
    renderer: new marked.Renderer(),
    highlight: function (code, language) {
      const hljs = require('highlight.js')
      const validLanguage = hljs.getLanguage(language) ? language : 'plaintext'
      return hljs.highlight(code, { language: validLanguage }).value
    },
    pedantic: false,
    gfm: true,
    breaks: false,
    sanitize: false,
    smartLists: true,
    smartypants: false,
    xhtml: false,
  })

  let indexName = process.env['ALGOLIA_INDEX_NAME']
  if (process.env['CONTEXT'] && process.env['CONTEXT'] !== 'production') {
    indexName = process.env['ALGOLIA_BRANCH_INDEX_NAME']
  }
  const searchClient = algoliasearch(process.env['ALGOLIA_APP_ID'], process.env['ALGOLIA_API_KEY'])
  const searchIndex = searchClient.initIndex(indexName)

  const IGNORE_TOKENS = [
    'blockquote_start',
    'blockquote_end',
    'hr',
    'html',
    'list_start',
    'list_end',
    'list_item_start',
    'list_item_end',
    'loose_item_start',
    'space',
  ]

  const tokenToSearchRecord = (book, chapter, section, token) => {
    const id = md5(`${book}:${chapter}:${section}:${token.type}:${token.text}`)
    const href = `/${book}/${paramCase(chapter.toLowerCase())}.html#${paramCase(section.toLowerCase())}`

    return {
      objectID: id,
      href,
      book: titleCase(book),
      chapter,
      section,
      type: token.type,
      text: token.text,
    }
  }

  publish = async (markdown, book, options = {}) => {
    const tokens = marked.lexer(markdown)
    const recordsToPublish = [] // records to be published to search
    const newRecordIDs = [] // IDs that we create during this process
    let existingRecordIDs = [] // IDs that are already in search
    let chapter = null
    let section = null

    console.info(`Publishing to search index "${indexName}"...`)

    const shouldPageBreak = (depth) => {
      return options.pageBreakAtHeadingDepth.indexOf(depth) !== -1
    }

    const shouldIgnoreToken = (type) => {
      return IGNORE_TOKENS.indexOf(type) !== -1
    }

    const isHeader = (type) => {
      return type === 'heading'
    }

    const isNewRecord = (record) => {
      const ids = options.objectIDs[record.book] && options.objectIDs[record.book][record.chapter]
      if (ids) {
        return ids.indexOf(record.objectID) === -1
      } else {
        return true
      }
    }

    tokens.forEach((token) => {
      if (shouldIgnoreToken(token.type)) {
        return
      }

      if (isHeader(token.type)) {
        if (shouldPageBreak(token.depth)) {
          // start a new page
          chapter = options.title || token.text
          section = options.title || token.text
        } else {
          // keep the same page, but change the section's name
          section = token.text
        }
      } else {
        if (options.title && chapter === null && section === null) {
          chapter = options.title
          section = options.title
        }
        const record = tokenToSearchRecord(book, chapter, section, token)
        newRecordIDs.push(record.objectID)

        if (isNewRecord(record)) {
          recordsToPublish.push(record)
        } else {
          // collect existing IDs from this book/chapter to be sure we have them all when we're done
          // `new Set` makes sure that we have a unique union of two arrays
          existingRecordIDs = [...new Set([...existingRecordIDs, ...options.objectIDs[record.book][record.chapter]])]
        }
      }
    })

    // push new records
    console.info(`-> Sending ${recordsToPublish.length} record(s) to search`)
    searchIndex.saveObjects(recordsToPublish)

    // figure out which records need to be deleted by doing a difference
    const idsToDelete = existingRecordIDs.filter((id) => !newRecordIDs.includes(id))
    console.info(`<- Deleting ${idsToDelete.length} record(s)`)
    searchIndex.deleteObjects(idsToDelete)
  }

  getObjectIDs = async () => {
    let objectIDs = {}

    await searchIndex.browseObjects({
      query: '',
      attributesToRetrieve: ['objectID', 'book', 'chapter'],
      batch: (batch) => {
        batch.forEach((b) => {
          if (!objectIDs[b.book]) {
            objectIDs[b.book] = {}
          }
          if (!objectIDs[b.book][b.chapter]) {
            objectIDs[b.book][b.chapter] = []
          }
          objectIDs[b.book][b.chapter].push(b.objectID)
        })
      },
    })

    return objectIDs
  }
} else {
  publish = () => {}
  getObjectIDs = () => []
}

module.exports = { publish, getObjectIDs }
