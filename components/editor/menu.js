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
      if (commands[key].enabled) {
        return !this.getValue(commands[key].enabled)
      } else {
        return false
      }
    },
    getValue(data) {
      // FIXME: optimize value pattern
      return this.$parent[data.slice(1)]
    }
  },
  inject: ['tabs', 'execute'],
  props: {
    current: {
      type: Object
    },
    data: {
      type: Array,
      required: true
    },
    move: {
      type: Number,
      required: true
    },
    embed: {
      type: Array,
      default() {
        return []
      }
    }
  },
  render: VueCompile(`<div class="content">
    <li v-for="(item, index) in data">
      <div v-if="item === '@separator'" class="menu-item disabled" @click.stop>
        <a class="separator"/>
      </div>
      <div v-else-if="item === '@tabs'">
        <li v-for="tab in tabs" :key="tab.id">
          <div class="menu-item" @click="execute('switchTabById', tab.id)">
            <a class="label" :class="{ active: tab.id === current.id }">{{ tab.title }}</a>
            <span class="binding">
              <i v-if="tab.changed" class="icon-circle" @click.stop="execute('closeTab', tab.id)"/>
              <i v-else class="icon-close" @click.stop="execute('closeTab', tab.id)"/>
            </span>
          </div>
        </li>
      </div>
      <div v-else-if="item instanceof Object">
        <!--transition :name="move !== 0 ? 'tm-menu' : ''"
          :leave-to-class="'transform-to-' + (move > 0 ? 'left' : move < 0 ? 'right' : 'none')"
          :enter-class="'transform-to-' + (move > 0 ? 'right' : move < 0 ? 'left' : 'none')"-->
          <tm-menu v-show="embed[index]" :data="item.content" :move="0" :current="current"/>
        <!--/transition-->
      </div>
      <div v-else-if="getContext(item)" class="menu-item disabled" @click.stop>
        <a class="label">{{ getCaption(item) }}</a>
        <span class="binding">{{ displayKeyBinding(item) }}</span>
      </div>
      <div v-else class="menu-item" @click="execute('executeCommand', item)">
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
  },
  methods: {
    hideContextMenus() {
      this.menubarActive = false
      for (const key in this.menuData) {
        this.menuData[key].show = false
        for (let index = 0; index < this.menuData[key].embed.length; index++) {
          this.menuData[key].embed.splice(index, 1, false)
        }
      }
    },
    showContextMenu(key, event) {
      const style = this.menuRef[key].style
      this.hideContextMenus()
      if (event.clientX + 200 > this.width) {
        style.left = event.clientX - 200 - this.left + 'px'
      } else {
        style.left = event.clientX - this.left + 'px'
      }
      if (event.clientY - this.top > this.height / 2) {
        style.top = ''
        style.bottom = this.top + this.height - event.clientY + 'px'
      } else {
        style.top = event.clientY - this.top + 'px'
        style.bottom = ''
      }
      this.menuData[key].show = true
    },
    hoverMenu(index, event) {
      if (this.menubarActive && !this.menuData.menubar.embed[index]) {
        this.showMenu(index, event)
      }
    },
    showMenu(index, event) {
      this.contextId = null
      const style = this.menuRef.menubar.style
      const last = this.menuData.menubar.embed.indexOf(true)
      if (last === index) {
        this.menubarActive = false
        this.menuData.menubar.show = false
        this.menuData.menubar.embed.splice(index, 1, false)
        return
      } else if (last === -1) {
        this.menubarMove = 0
      } else {
        this.menubarMove = index - last
      }
      this.hideContextMenus()
      if (event.currentTarget.offsetLeft + 200 > this.width) {
        style.left = event.currentTarget.offsetLeft + event.currentTarget.offsetWidth - 200 + 'px'
      } else {
        style.left = event.currentTarget.offsetLeft + 'px'
      }
      style.top = event.currentTarget.offsetTop + event.currentTarget.offsetHeight + 'px'
      this.menubarActive = true
      this.menuData.menubar.show = true
      this.menuData.menubar.embed.splice(index, 1, true)
    }
  }
}