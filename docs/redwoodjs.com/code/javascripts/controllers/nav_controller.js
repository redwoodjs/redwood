import { Controller } from 'stimulus'

export default class extends Controller {
  static get targets() {
    return ['link']
  }

  connect() {
    this._highlightNav()
    document.dispatchEvent(new Event('navigated'))
  }

  // opens/closes a nav section
  toggle(event) {
    event.preventDefault()
    event.currentTarget.nextSibling.nextSibling.classList.toggle('hidden')
  }

  // Highlight nav items if the URL matches the `href` on the link.
  //
  // If no links matched, look at the data-match attribute on the first link in
  // a list and if one of those matches, highlight it
  _highlightNav() {
    let linkFound = false

    this.linkTargets.forEach((link) => {
      if (this._linkDoesMatch(link)) {
        this._activateLink(link)
        linkFound = true
      } else {
        this._deactivateLink(link)
      }
      return !linkFound
    })

    if (!linkFound) {
      this._fallbackLink()
    }
  }

  _linkDoesMatch(link) {
    return location.href.indexOf(link.href) !== -1
  }

  _fallbackLink() {
    this.linkTargets.every((link) => {
      if (link.dataset.match && location.href.indexOf(link.dataset.match) !== -1) {
        this._activateLink(link)
        return false
      } else {
        return true
      }
    })
  }

  _activateLink(link) {
    link.classList.add(...this.activeClasses)
    if (this.removeClasses.length) {
      link.classList.remove(...this.removeClassesClasses)
    }
    // make sure whole parent list is visible
    link.closest('ul').classList.remove('hidden')
  }

  _deactivateLink(link) {
    link.classList.remove(...this.activeClasses)
  }

  get removeClasses() {
    return this.data.get('remove') ? this.data.get('remove').split(' ') : []
  }

  get activeClasses() {
    return this.data.get('active').split(' ')
  }
}
