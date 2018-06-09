const Thulium = require('../../library/Thulium')
const fs = require('fs')

module.exports = class TmTab {
  constructor({
    title = 'New',
    type = 'tm',
    value = '',
    start = null,
    end = null,
    volume = 1,
    path = null,
    old = '',
    origin = null
  } = {}) {
    this.title = title
    this.type = type
    this.value = value
    this.volume = volume
    this.start = start
    this.end = end
    this.path = path
    this.old = old
    this.origin = origin
    if (path && old === '' && fs.existsSync(path)) {
      fs.readFile(path, { encoding: 'utf8' }, (_, data) => this.checkChange(data))
    }
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

  checkChange(data) {
    if (data !== undefined) this.old = data
    this.changed = this.old !== this.value
  }

  isEmpty() {
    return this.path === null && this.old === '' && this.model.getValue(1) === ''
  }

  save(path) {
    if (!path) {
      path = this.path
    } else {
      this.path = path
    }
    fs.writeFile(path, this.value, { encoding: 'utf8' }, () => {
      this.old = this.value
      this.changed = false
    })
  }

  toJSON() {
    return {
      title: this.title,
      type: this.type,
      value: this.model.getValue(global.user.state.Settings['line-ending'] === 'LF' ? 1 : 2),
      volume: this.volume,
      start: this.start,
      end: this.end,
      path: this.path
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
