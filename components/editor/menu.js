const { keymap, commands } = require('./command')

module.exports = {
  name: 'TmMenu',

  mounted() {
    console.log(this.show)
  },

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
    menu: {
      type: Array,
      required: true
    },
    show: {
      default: false
    },
    embed: {
      default() {
        return []
      }
    }
  },
  render: VueCompile(`<transition name="el-zoom-in-top">
    <ul v-show="show" class="tm-menu">
      <li v-for="(item, index) in menu">
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
          <tm-menu :menu="item.content" :show="true"/>
        </div>
        <div v-else class="menu-item" v-show="getContext(item)"
          @click="execute('executeCommand', item)">
          <a class="label">{{ getCaption(item) }}</a>
          <span class="binding">{{ displayKeyBinding(item) }}</span>
        </div>
      </li>
    </ul>
  </transition>`)
}