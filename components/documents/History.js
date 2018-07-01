const fs = require('fs')
const yaml = require('js-yaml')

class TmDocTree {
  constructor() {
    this.source = yaml.safeLoad(fs.readFileSync(TmDocTree.sourcePath, { encoding: 'utf8' }))
    if (fs.existsSync(TmDocTree.indexPath)) {
      this.index = require(TmDocTree.indexPath)
    } else {
      this.index = this.source
      fs.writeFileSync(TmDocTree.indexPath, JSON.stringify(this.index), { encoding: 'utf8' })
    }

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
    walk(this.source)
    this.dictionary = dictionary
    this.defaultDoc = defaultDoc
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

  update() {
    if (global.env === 0) return
  }
}

TmDocTree.sourcePath = __dirname + '/../../documents/index.yaml'
TmDocTree.indexPath = __dirname + '/index.json'

const defaultState = {
  path: '/overview',
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
      currentId: history.length - 1
    }
  },

  computed: {
    current() {
      return this.history[this.currentId]
    }
  },

  mounted() {
    this.move()
    addEventListener('beforeunload', () => {
      localStorage.setItem('recent', JSON.stringify(this.recent))
    })
  },

  methods: {
    move(delta = 0) {
      this.switchTo(this.currentId + delta)
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
    switchTo(id) {
      if (id >= 0 && id < this.history.length) {
        this.currentId = id
        this.setContent()
      }
    },
    viewRecent(id) {
      this.pushState(Object.assign({}, this.recent[id]))
    },
    deleteAt(id) {
      // if (this.history.length === 1) {
      //   this.recent.splice(id, 1, defaultState)
      // } else {
      this.recent.splice(id, 1)
      //   if (id === this.currentId) this.currentId -= 1
      // }
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