const Thulium = require('../../library/Thulium')
let count = 0

module.exports = class Tab {
  constructor({
    title,
    type = 'tm',
    value = '',
    start = null,
    end = null,
    volume = 1
  } = {}) {
    this.title = title === undefined ? `Untitled ${++count}` : title
    this.type = type
    this.value = value
    this.volume = volume
    this.start = start
    this.end = end
    this.tm = null
    Object.defineProperty(this, 'model', {
      configurable: false,
      value: window.monaco.editor.createModel(value, type)
    })
  }

  toJSON() {
    return {
      title: this.title,
      type: this.type,
      value: this.model.getValue(1, false),
      volume: this.volume,
      start: this.start,
      end: this.end
    }
  }

  static load(newIfNone = false) {
    const tabString = localStorage.getItem('tabs')
    if (tabString === null) {
      return newIfNone ? [new Tab()]: []
    } else {
      try {
        const tabs = JSON.parse(tabString)
        if (tabs.length === 0) {
          return newIfNone ? [new Tab()] : []
        }
        return tabs.map((tab) => new Tab(tab))
      } catch (e) {
        console.warn('The tabs information is malformed.')
        return newIfNone ? [new Tab()] : []
      }
    }
  }

  static save(tabs) {
    localStorage.setItem('tabs', JSON.stringify(tabs))
  }
}
