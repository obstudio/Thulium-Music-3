const Thulium = require('../../library/Thulium')
const fs = require('fs')
const path = require('path')
let count = 0

class TmTab {
  constructor({
    title,
    type = 'tm',
    value = '',
    start = null,
    end = null,
    volume = 1,
    path = null,
    origin = '',
    id = null,
    changed = false
  } = {}) {
    this.type = type
    this._value = value
    this.volume = volume
    this.start = start
    this.end = end
    this.path = path
    this.origin = origin
    this.changed = changed
    this.title = title === undefined ? `Untitled ${++count}` : title
    this.id = id ? id : Math.floor(Math.random() * 1e10)
    if (path && origin === '' && fs.existsSync(path)) {
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
    this.currentVersionId = this.model.getVersionId()
    this.latestVersionId = this.currentVersionId
    this.model.tab = this
    this.thulium.tab = this
  }

  get value() {
    if (this.currentVersionId === this.latestVersionId) return this._value
    this.currentVersionId = this.latestVersionId
    return this._value = this.model.getValue(
      TmTab.config['line-ending'] === 'LF' ? 1 : 2
    )
  }

  onModelChange(listener) {
    this.model.onDidChangeContent(listener)
  }

  dispose() {
    this.model.dispose()
  }

  checkChange(data) {
    if (data !== undefined) this.origin = data
    this.changed = this.origin !== this.value
  }

  isEmpty() {
    return this.path === null && this.origin === '' && this.model.getValue(1) === ''
  }

  save(filepath) {
    if (!filepath) {
      filepath = this.path
    } else {
      this.path = filepath
      this.title = path.basename(filepath).replace(/\.tml?$/, '')
    }
    fs.writeFile(filepath, this.value, { encoding: 'utf8' }, () => {
      this.origin = this.value
      this.changed = false
    })
  }

  toJSON() {
    return {
      title: this.title,
      type: this.type,
      value: this.value,
      volume: this.volume,
      start: this.start,
      end: this.end,
      path: this.path,
      id: this.id
    }
  }
}

TmTab.config = {}

module.exports = TmTab