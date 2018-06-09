const Thulium = require('../../library/Thulium')
let count = 0

module.exports = class TmTab {
  constructor({
    title,
    type = 'tm',
    value = '',
    start = null,
    end = null,
    volume = 1,
    path = null,
    old = '',
    origin = null
  } = {}) {
    this.title = title === undefined ? `Untitled ${++count}` : title
    this.type = type
    this.value = value
    this.volume = volume
    this.start = start
    this.end = end
    this.path = path
    this.old = old
    this.origin = origin
    Object.defineProperty(this, 'model', {
      configurable: false,
      value: window.monaco.editor.createModel(value, type)
    })
    Object.defineProperty(this, 'thulium', {
      configurable: false,
      value: new Thulium(value, { useFile: false })
    })
    this.model.tm = this.thulium
  }

  hasChanged() {
    return this.old !==
      this.model.getValue(global.user.state.Settings['line-ending'] === 'LF' ? 1 : 2)
  }

  isEmpty() {
    return this.old === '' && this.model.getValue(1) === ''
  }

  toJSON() {
    return {
      title: this.title,
      type: this.type,
      value: this.model.getValue(1, false),
      volume: this.volume,
      start: this.start,
      end: this.end,
      path: this.path,
      old: this.old
    }
  }

  static load() {
    const tabString = localStorage.getItem('tabs')
    if (tabString === null) {
      return [ new TmTab() ]
    } else {
      try {
        const tabs = JSON.parse(tabString)
        if (tabs.length === 0) {
          return [ new TmTab() ]
        }
        return tabs.map(tab => new TmTab(tab))
      } catch (e) {
        console.warn('The tabs information is malformed.')
        return [ new TmTab() ]
      }
    }
  }

  static save(tabs) {
    localStorage.setItem('tabs', JSON.stringify(tabs))
  }
}
