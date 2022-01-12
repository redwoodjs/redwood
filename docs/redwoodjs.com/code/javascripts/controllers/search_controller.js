import { Controller } from 'stimulus'
import template from 'lodash.template'
import escape from 'lodash.escape'
import clone from 'lodash.clone'
import algoliasearch from 'algoliasearch'

export default class extends Controller {
  static get targets() {
    return ['input', 'results']
  }

  initialize() {
    // create a handler bound to `this` that we can add and remove
    this.documentClickHandler = () => {
      this.close()
    }

    this.client = algoliasearch(process.env.ALGOLIA_APP_ID, process.env.ALGOLIA_SEARCH_KEY)
    this.index = this.client.initIndex(process.env.ALGOLIA_INDEX_NAME)
    this.searchOptions = {
      hitsPerPage: 10,
      attributesToRetrieve: '*',
      attributesToSnippet: 'text:20,section:20',
      attributesToHighlight: null,
      snippetEllipsisText: '…',
      analytics: true,
    }

    this.searchResultTemplate = template(`
      <a href="\${href}" class="p-2 block hover:bg-red-100 rounded searchresult">
        <div class="md:flex items-center">
          <h3 class="md:w-1/3 text-sm text-red-700 leading-5">\${chapter}</h3>
          <div class="md:w-2/3 md:ml-2">
            <h4 class="text-sm text-red-500">\${section}</h3>
            <p class="text-xs text-gray-500 \${
              type == "code" ? "font-mono bg-red-200 text-red-500 p-1 rounded" : ""
            }">\${text}</p>
          </div>
        </div>
      </a>`)
  }

  // Run search on keystrokes
  search(event) {
    event.stopPropagation()

    if (event.currentTarget.value.trim() !== '') {
      if (event.key === 'Escape') {
        this.close()
        return
      } else {
        this.index.search(event.currentTarget.value, this.searchOptions).then((data) => {
          this._parseResults(data)
        })
      }
    } else {
      this._clear()
    }
  }

  close() {
    this.resultsTarget.classList.add('hidden')
    document.removeEventListener('click', this.documentClickHandler)
  }

  _clear() {
    this.resultsTarget.innerHTML = ''
    this.close()
  }

  _formatSection(text) {
    // return escape(text.replace(/`/g, ''))

    let output = text.replace(/`/g, '')

    // no idea why, but sometimes opening and closing HTML tags in results from Algolia
    // are already escaped properly, and if we don't do this check here then they'll
    // get double-escaped and show &lt; and &gt;
    if (!output.match(/&lt;/)) {
      output = escape(output)
    }
    return output
  }

  _formatText(text) {
    return escape(text.replace(/`/g, ''))
  }

  _parseResults(data) {
    if (data.hits.length === 0) {
      return this._show(
        `<p class="text-sm font-semibold">No docs found for <span class="text-red-700">${data.query}</span></p>`
      )
    }

    const sections = []
    data.hits.map((hit) => {
      if (sections.indexOf(hit.book) === -1) {
        sections.push(hit.book)
      }
    })

    const items = {}
    data.hits.forEach((hit) => {
      let attributes = Object.assign(clone(hit), {
        text: this._formatText(hit.text),
        section: this._formatSection(hit.section),
      })
      let html = this.searchResultTemplate(attributes)

      if (items[hit.book]) {
        items[hit.book].push(html)
      } else {
        items[hit.book] = [html]
      }
    })

    let output = ''
    for (let item in items) {
      output += `<h2 class="mt-2 mb-1 pb-1 pl-2 border-b text-gray-500 font-semibold">${item}</h2>`
      output += items[item].join('')
    }

    this._show(output)
  }

  _show(html) {
    this.resultsTarget.classList.remove('hidden')
    this.resultsTarget.innerHTML = html
    document.addEventListener('click', this.documentClickHandler)
  }
}
