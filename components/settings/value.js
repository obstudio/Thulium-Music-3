const value = {
  get() {
    return this.model.split('.').reduce((prev, curr) => {
      if (curr === '') curr = 'settings'
      return prev[curr]
    }, this.$parent)
  },
  set(value) {
    this.model.split('.').reduce((prev, curr, index, array) => {
      if (curr === '') curr = 'settings'
      if (index === array.length - 1) {
        prev[curr] = value
      } else {
        return prev[curr]
      }
    }, this.$parent)
    global.saveSettings()
  }
}

module.exports = value