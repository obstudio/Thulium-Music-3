const value = {
  get() {
    return this.model.split('.').reduce((prev, curr) => {
      curr = curr || 'settings'
      return prev[curr]
    }, this.$parent)
  },
  set(value) {
    this.model.split('.').reduce((prev, curr, index, array) => {
      curr = curr || 'settings'
      if (index === array.length - 1) {
        prev[curr] = value
      } else {
        return prev[curr]
      }
    }, this.$parent)
    this.$store.commit('saveSettings')
  }
}

module.exports = value