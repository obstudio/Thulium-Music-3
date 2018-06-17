const { keymap, commands } = require('./command')
const menus = require('./menu.json')
const Vue = require('vue')

Vue.component('tm-menu', {
  name: 'TmMenu',
  methods: {
    displayKeyBinding(key) {
      let binding = keymap[key]
      if (!binding) return ''
      if (binding.charAt(0) === '!') binding = binding.slice(1)
      return binding.replace(/[a-z]+/g, word => {
        return word.charAt(0).toUpperCase() + word.slice(1)
      }).replace(/ /g, ', ')
    },
    getCaption(key) {
      if (commands[key].caption) {
        let pointer
        for (pointer = 0; pointer < commands[key].caption.length; pointer++) {
          if (this.getValue(commands[key].caption[pointer])) break
        }
        return this.$t(`editor.menu.${key}.${pointer}`)
      } else {
        return this.$t(`editor.menu.${key}`)
      }
    },
    getContext(key) {
      if (commands[key].context) {
        return this.getValue(commands[key].context)
      } else {
        return true
      }
    },
    getValue(data) {
      // FIXME: optimize value pattern
      return this.$parent[data.slice(1)]
    }
  },
  inject: ['tabs', 'execute'],
  props: {
    data: {
      type: Array,
      required: true
    },
    embed: {
      type: Array,
      default() {
        return []
      }
    }
  },
  render: VueCompile(`<div>
    <li v-for="(item, index) in data">
      <div v-if="item === '@separator'" class="menu-item disabled" @click.stop>
        <a class="separator"/>
      </div>
      <div v-else-if="item === '@tabs'">
        <li v-for="tab in tabs">
          <div class="menu-item" @click="execute('switchTabById', tab.id)">
            <a class="label">{{ tab.title }}</a>
          </div>
        </li>
      </div>
      <div v-else-if="item instanceof Object" v-show="embed[index]">
        <tm-menu-content :data="item.content"/>
      </div>
      <div v-else class="menu-item" v-show="getContext(item)"
        @click="execute('executeCommand', item)">
        <a class="label">{{ getCaption(item) }}</a>
        <span class="binding">{{ displayKeyBinding(item) }}</span>
      </div>
    </li>
  </div>`)
})

const menuData = {}
const menuKeys = Object.keys(menus)
for (const key of menuKeys) {
  menuData[key] = {
    show: false,
    content: menus[key],
    embed: new Array(menus[key].length).fill(false)
  }
}

module.exports = {
  menuData,
  menuKeys,
  onMount() {
    this.menuRef = {}
    for (let index = 0; index < menuKeys.length; index++) {
      this.menuRef[menuKeys[index]] = this.$refs.menus.children[index]
    }
  }
}