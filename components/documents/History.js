const fs = require('fs')

class TmDocTree {
  constructor() {
    const self = this
    function processStructure() {
      const dictionary = {}
      const defaultDoc = {}
      function walk(index, base = '') {
        if (base.startsWith('/documents')) base = base.slice(10)
        if (index.type === 'folder') {
          const path = base + '/' + index.name
          dictionary[path] = index.title
          if (index.default !== null) {
            defaultDoc[path] = path + '/' + index.default + '.tmd'
          }
          for (const child of index.children) {
            walk(child, path)
          }
        } else if (index.type === 'file') {
          dictionary[base + '/' + index.name] = index.title
        }
      }
      walk(self.source)
      self.dictionary = dictionary
      self.defaultDoc = defaultDoc
    }
    if (global.env) {
      const structurePath = __dirname + '/../../build/structure.json'
      const readStructure = () => {
        try {
          self.source = JSON.parse(fs.readFileSync(structurePath, 'utf8'))
        } catch (e) {
          if (!self.source) this.source = {}
        }
      }
      fs.watch(structurePath, () => {
        readStructure()
        processStructure()
      })
      readStructure()
    } else {
      this.source = require('../../build/structure.json')
    }

    processStructure()
  }

  getPath(route) {
    const result = []
    let pointer = 0, index
    while ((index = route.slice(pointer + 1).search('/')) !== -1) {
      pointer += index + 1
      const base = route.slice(0, pointer)
      result.push({
        route: base,
        title: this.dictionary[base]
      })
    }
    result.push({
      route: route,
      title: this.dictionary[route]
    })
    return result
  }
}

const defaultState = {
  path: '/overview.tmd',
  anchor: null,
  scroll: 0
}

module.exports = {
  data() {
    const source = localStorage.getItem('recent')
    let history = [defaultState]
    try {
      const data = JSON.parse(source)
      if (data instanceof Array) history = data
    } catch (err) {
      console.error(err)
    }

    return {
      tree: new TmDocTree(),
      history: history,
      recent: history.slice(),
      actualId: history.length - 1
    }
  },

  computed: {
    current() {
      return this.history[this.actualId]
    },
    currentId: {
      get() {
        return this.actualId
      },
      set(newValue) {
        const oldState = this.current
        if (newValue >= 0 && newValue < this.history.length) {
          this.actualId = newValue
          const newState = this.current
          if (oldState && oldState.path === newState.path) {
            this.setPosition()
          } else {
            this.loadContent()
          }
        }
      }
    }
  },

  mounted() {
    this.loadContent()
    addEventListener('beforeunload', () => {
      localStorage.setItem('recent', JSON.stringify(this.recent))
    })
  },

  methods: {
    move(delta = 0) {
      this.currentId += delta
    },
    switchDoc(index) {
      const anchor = index.match(/#(.+)$/)
      if (anchor) index = index.slice(0, anchor.index)
      const state = {
        path: this.tree.defaultDoc[index] || index,
        anchor: anchor ? anchor[1] : null,
        scroll: anchor ? anchor[1] : 0
      }
      if (this.current.path === state.path && this.current.anchor === state.anchor) {
        this.current.scroll = this.current.anchor
        this.move()
      } else {
        this.pushState(state)
        this.recent.push(state)
      }
    },
    pushState(state) {
      this.history.splice(this.currentId + 1, Infinity, state)
      this.move(1)
    },
    viewRecent(id) {
      this.pushState(Object.assign({recent: true}, this.recent[id]))
    },
    deleteAt(id) {
      this.recent.splice(id, 1)
    },
    getRecent(amount = Infinity) {
      const start = amount > this.recent.length ? 0 : this.history.length - amount
      return this.recent.slice(start).map((state, index) => {
        const path = this.tree.getPath(state.path).map(node => node.title).join(' / ')
        const anchor = state.anchor ? ' # ' + state.anchor : ''
        return {
          title: path + anchor,
          id: start + index
        }
      }).reverse()
    }
  }
}