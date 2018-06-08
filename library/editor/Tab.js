module.exports = class Tab {
  constructor({
    title = 'New',
    type = 'tm',
    value = ''
  } = {}) {
    this.title = title
    this.type = type
    this.value = value
    this.volume = 1
    Object.defineProperty(this, 'model', {
      configurable: false,
      value: window.monaco.editor.createModel(value, type)
    })
  }

  toJSON() {
    return {
      title: this.title,
      type: this.type,
      value: this.model.getValue(1, false)
    }
  }

  // update(newTitle) {
  //   return new Tab({
  //     title: newTitle,
  //     type: this.type,
  //     value: this.value
  //   })
  // }

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
        return []
      }
    }
  }

  static save(tabs) {
    localStorage.setItem('tabs', JSON.stringify(tabs))
  }
}
