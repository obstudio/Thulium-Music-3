module.exports = class TmHistory {
  constructor(onStateChange, toRoutePath) {
    this._states = []
    this._pointer = -1
    this.onStateChange = onStateChange || (() => {})
    this.toRoutePath = toRoutePath || (() => {})
  }

  get length() {
    return this._states.length
  }

  get current() {
    return this._states[this._pointer]
  }

  go(delta = 0) {
    const nextPointer = delta + this._pointer
    if (nextPointer >= 0 && nextPointer < this.length) {
      this.onStateChange(this._states[nextPointer], this._states[this._pointer])
      this._pointer = nextPointer
    }
  }

  back() {
    this.go(-1)
  }

  forward() {
    this.go(1)
  }

  pushState(state) {
    if (this._pointer < this.length - 1) {
      this._states.splice(this._pointer + 1, this.length - 1 - this._pointer, state)
    } else {
      this._states.push(state)
    }
    this.go(1)
  }

  replaceState(state) {
    this._states.splice(this._pointer, this.length - this._pointer, state)
    this.go()
  }

  recent(amount = Infinity) {
    return this._states.slice(-amount).reverse().map(state => {
      return {
        title: this.toRoutePath(state.path) + (state.anchor ? ' # ' + state.anchor : ''),
        id: state.path + (state.anchor ? '#' + state.anchor : '')
      }
    })
  }
}