import { Controller } from 'stimulus'
import hljs from 'highlight.js'
import ClipboardJS from 'clipboard'

export default class extends Controller {
  static get targets() {
    return ['header','logo','search','stars','nav','innerNav','body','code','year','thanks', 'cone']
  }

  connect() {
    // set the year in the footer
    this.yearTarget.textContent = new Date().getFullYear()

    // code highlighting
    this.codeTargets.forEach((target) => {
      hljs.highlightBlock(target)
    })

    // show the header logo unless we're on the homepage
    if (!this.isHomePage) {
      this.logoTarget.classList.remove('lg:hidden')
    }

    // add copy buttons to code blocks
    this._enableCopy()

    // if there is a hash in the URL, open a collapsed sections that contains that target
    this._openCollapsedSectionForHash()

    // show the star count
    this._showStarCount()

    // show a rain of cones on the sticker thank you page
    if (this.hasThanksTarget) {
      this._spawnCones()
    }
  }

  focusSearch(event) {
    if (event.code === 'Slash' && !this.someInputHasFocus) {
      this.searchTarget.focus()
      event.preventDefault()
    }
  }

  toggleNav() {
    this.navTarget.classList.toggle('hidden')
    this.bodyTarget.classList.toggle('hidden')
  }

  closeNav() {
    this.navTarget.classList.add('hidden')
    this.bodyTarget.classList.remove('hidden')
  }

  saveScrollPosition() {
    window.navScrollPosition = this.innerNavTarget.scrollTop
    if (window.scrollY > this.headerTarget.offsetHeight) {
      window.windowScrollPosition = this.headerTarget.offsetHeight
    } else {
      window.windowScrollPosition = window.scrollY
    }
  }

  restoreScrollPosition() {
    if (window.navScrollPosition !== 0 || window.windowScrollPosition !== 0) {
      this.innerNavTarget.scrollTop = window.navScrollPosition || 0
      window.scrollTo(null, window.windowScrollPosition || 0)
    }
  }

  _enableCopy() {
    const COPY_BUTTON_CSS = [
      'copy-button',
      'absolute',
      'right-0',
      'bottom-0',
      'm-2',
      'text-xs',
      'text-gray-500',
      'hover:text-gray-400',
      'bg-gray-800',
      'hover:bg-gray-700',
      'px-1',
      'rounded',
      'focus:outline-none',
      'transition',
      'duration-100',
      'focus:outline-none',
      'focus:shadow-outline',
    ]
    const codeBlocks = document.getElementsByTagName('code')
    for (let block of codeBlocks) {
      const parent = block.parentElement

      // is this is a copyable code block <pre><code>...</code></pre>
      if (parent.tagName === 'PRE') {
        parent.classList.add('relative')
        var button = document.createElement('button')
        button.classList.add(...COPY_BUTTON_CSS)
        button.textContent = 'Copy'
        block.parentElement.appendChild(button)

        new ClipboardJS('.copy-button', {
          text: (trigger) => {
            this._copiedMessage(trigger)
            return this._stripComments(trigger.previousElementSibling.innerText)
          },
        })
      }
    }
  }

  _copiedMessage(trigger) {
    trigger.focus()
    trigger.textContent = 'Copied'
    setTimeout(() => {
      trigger.textContent = 'Copy'
    }, 750)
  }

  // strips any leading comments out of a chunk of text
  _stripComments(content) {
    let lines = content.split('\n')

    if (lines[0].match(/^\/\/|\*/)) {
      lines.shift()
      // remove empty lines after comments
      while (lines[0].trim() === '') {
        lines.shift()
      }
    }

    return lines.join('\n')
  }

  _openCollapsedSectionForHash() {
    let hash = location.hash

    if (hash) {
      hash = hash.substring(1)

      const element = document.getElementById(hash)
      const parent = element.parentNode

      if (parent.tagName === 'DETAILS') {
        parent.open = true
        window.scrollTo(0, element.offsetTop)
      }
    }
  }

  _spawnCones() {
    let count = 0

    while (count < 20) {
      const fallTime = Math.random() * 2 + 1.5
      const rotateStart = Math.random() * 360 - 180
      const rotateEnd = Math.random() * 360 - 180
      const wait = Math.random() * 1
      const size = Math.random() * 64 + 24
      const cone = this.coneTarget.cloneNode(true)

      this.element.appendChild(cone)
      cone.style.left = `${Math.random() * this.element.offsetWidth}px`
      cone.style.width = `${size}px`
      cone.style.setProperty('--rotateStart',`${rotateStart}deg`)
      cone.style.setProperty('--rotateEnd',`${rotateEnd}deg`)

      setTimeout(() => {
        cone.classList.remove('hidden')
        cone.style.animation = `falling ${fallTime}s ease-in forwards`
      }, wait * 1000)

      count++
    }
  }

  async _showStarCount() {
    const stars = await this._getStarCount()
    this.starsTarget.textContent = stars
  }

  async _getStarCount() {
    const response = await fetch('https://api.github.com/repos/redwoodjs/redwood')
    const body = await response.json()
    return body.stargazers_count
  }

  get isHomePage() {
    return location.pathname === '/'
  }

  get someInputHasFocus() {
    return ['INPUT', 'TEXTAREA'].indexOf(document.activeElement.tagName) !== -1
  }
}
