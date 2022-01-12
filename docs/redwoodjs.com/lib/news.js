const fs = require('fs')
const path = require('path')

const template = require('lodash.template')
const marked = require('marked')
marked.setOptions({
  renderer: new marked.Renderer(),
  pedantic: false,
  gfm: true,
  breaks: false,
  sanitize: false,
  smartLists: true,
  smartypants: false,
  xhtml: false,
})

const HTML_ROOT = path.join('code', 'html')
const TEMPLATE_ROOT = path.join('lib', 'templates')
const NEWS_PATH = path.join(HTML_ROOT, 'news.html')
const TAG_COLORS = {
  Podcast: 'blue-500',
  Article: 'orange-500',
  Video: 'purple-500',
  'Message Thread': 'yellow-400',
  Newsletter: 'orange-700',
  Meetup: 'green-500',
}

const articleTemplate = template(fs.readFileSync(path.join(TEMPLATE_ROOT, 'news_article.html.template')).toString())
const newsTemplate = template(fs.readFileSync(path.join(TEMPLATE_ROOT, 'news.html.template')).toString())

const parseMarkdown = () => {
  const articles = [{}]
  const markdown = fs.readFileSync(path.join('.', 'NEWS.md')).toString()
  const tokens = marked.lexer(markdown)
  let index = 0

  tokens.forEach((token) => {
    switch (token.type) {
      case 'hr':
        index++
        articles[index] = {}
        return
      case 'heading':
        articles[index] = Object.assign(articles[index], parseHeading(token))
        return
      case 'paragraph':
        articles[index] = Object.assign(articles[index], parseImage(token))
        return
      default:
        return
    }
  })

  return sortArticles(articles)
}

const sortArticles = (articles) => {
  return articles.sort((a, b) => {
    const aDate = new Date(a.date)
    const bDate = new Date(b.date)

    return bDate - aDate
  })
}

const generateAll = (articles) => {
  return articles
    .map((article) => {
      return articleTemplate(Object.assign(article, { colors: TAG_COLORS }))
    })
    .join('\n')
}

const generateColumns = (articles) => {
  const columns = [[], [], []]
  let index = 0

  articles.forEach((article) => {
    columns[index].push(articleTemplate(Object.assign(article, { colors: TAG_COLORS })))
    index = (index + 1) % 3
  })

  return {
    column1: columns[0].join('\n'),
    column2: columns[1].join('\n'),
    column3: columns[2].join('\n'),
  }
}

const parseHeading = (token) => {
  let output = {}

  switch (token.depth) {
    case 1:
      output.link = token.text.match(/\((.*?)\)/)[1]
      output.title = token.text.match(/\[(.*?)\]/)[1]
    case 2:
      output.date = token.text
    case 3:
      output.description = token.text
    case 4:
      output.tags = token.text.split(',').map((tag) => tag.trim())
  }

  return output
}

const parseImage = (token) => {
  return {
    image: token.text.match(/\((.*?)\)/)[1],
    alt: token.text.match(/\[(.*?)\]/)[1],
  }
}

const run = () => {
  const articles = parseMarkdown()
  const { column1, column2, column3 } = generateColumns(articles)
  const vars = {
    allArticles: generateAll(articles),
    column1,
    column2,
    column3,
  }

  fs.writeFileSync(NEWS_PATH, newsTemplate(vars))
}

module.exports = { run }
