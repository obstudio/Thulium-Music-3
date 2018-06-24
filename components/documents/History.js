const index = require('../../documents/index.json')

const dictionary = {}
const defaultDoc = {}

function walk(index, base = '') {
  for (const item of index) {
    if (item instanceof Array) {
      dictionary[base + '/' + item[0]] = item[1]
    } else {
      const path = base + '/' + item.name[0]
      walk(item.content, path)
      dictionary[path] = item.name[1]
      defaultDoc[path] = path + '/' + item.default
    }
  }
}

walk(index)

function getPath(route) {
  const result = []
  let pointer = 0, index
  while ((index = route.slice(pointer + 1).search('/')) !== -1) {
    pointer += index + 1
    const base = route.slice(0, pointer)
    result.push({
      route: base,
      title: dictionary[base]
    })
  }
  result.push({
    route: route,
    title: dictionary[route]
  })
  return result
}

class TmHistory {
  constructor(states = [], onStateChange = () => {}) {
    this._states = states
    this._pointer = states.length - 1
    this.onStateChange = onStateChange
  }

  get length() {
    return this._states.length
  }

  get current() {
    return this._states[this._pointer]
  }

  toJSON() {
    return this._states
  }

  move(delta = 0) {
    const nextPointer = delta + this._pointer
    if (nextPointer >= 0 && nextPointer < this.length) {
      this.onStateChange(this._states[nextPointer], this._states[this._pointer])
      this._pointer = nextPointer
    }
  }

  pushState(state) {
    if (this._pointer < this.length - 1) {
      this._states.splice(this._pointer + 1, this.length - 1 - this._pointer, state)
    } else {
      this._states.push(state)
    }
    this.move(1)
  }

  setState(state) {
    this._states.splice(this._pointer, this.length - this._pointer, state)
    this.move()
  }

  deleteIndex(id) {
    this._states.splice(id, 1)
  }

  recent(amount = Infinity) {
    const start = amount > this._states.length ? 0 : this._states.length - amount
    return this._states.slice(start).map((state, index) => {
      const path = getPath(state.path).map(node => node.title).join(' / ')
      const anchor = state.anchor ? ' # ' + state.anchor : ''
      return {
        title: path + anchor,
        id: start + index
      }
    }).reverse()
  }

  static load() {
    const source = localStorage.getItem('history')
    try {
      const data = JSON.parse(source)
      if (data instanceof Array) {
        return JSON.parse(source)
      } else {
        return []
      }
    } catch (err) {
      console.error('emmmm')
      return []
    }
  }
  
  static save() {
    localStorage.setItem('history', JSON.stringify(this.history))
  }
}

TmHistory.index = index

TmHistory.methods = {
  getPath,
  switchTo(id) {
    const state = this.history._states[id]
    this.switchDoc(state.path + (state.anchor ? '#' + state.anchor : ''))
  },
  deleteAt(id) {
    this.history._states.splice(id, 1)
  },
  move(delta) {
    this.history.move(delta)
  },
  switchDoc(index) {
    const anchor = index.match(/#(.+)$/)
    if (anchor) index = index.slice(0, anchor.index)
    const state = {
      path: defaultDoc[index] || index,
      anchor: anchor ? anchor[1] : null,
      scroll: anchor ? anchor[1] : 0
    }
    this.history.pushState(state)
  },
  getRecent() {
    return this.history ? this.history.recent(10) : []
  }
}

module.exports = TmHistory