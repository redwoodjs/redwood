const fs = require('fs')
const path = require('path')

const { create: createDocs } = require('./docutron.js')

const HTML_ROOT = path.join('code', 'html')

const run = () => {
  console.info(`\nROADMAP...`)

  const markdown = fs.readFileSync('./ROADMAP.md').toString()
  const styles = {
    Accessibility: 4,
    Auth: 4,
    Core: 3,
    Deployment: 4,
    Docs: 3,
    Generators: 4,
    Logging: 4,
    Performance: 2,
    Prerender: 4,
    Router: 4,
    Storybook: 4,
    Structure: 3,
    ['Testing (App)']: 4,
    TypeScript: 3,
  }
  const [page] = createDocs(markdown, '', { pageBreakAtHeadingDepth: [1], file: './ROADMAP.md', styles })
  fs.writeFileSync(path.join(HTML_ROOT, page.href), page.html)
}

module.exports = { run }
