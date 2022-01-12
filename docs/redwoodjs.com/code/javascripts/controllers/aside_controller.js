import { Controller } from 'stimulus'

let scroll

export default class extends Controller {
  connect() {
    this.element.scrollTop = scroll
  }

  saveScroll() {
    scroll = this.element.scrollTop
  }
}
