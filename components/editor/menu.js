const { keymap, commands } = require('./command')

module.exports = {
  name: 'TmMenu',

  methods: {
    displayKeyBinding(key) {
      let binding = keymap[key]
      if (!binding) return ''
      if (binding.charAt(0) === '!') binding = binding.slice(1)
      return binding.replace(/[a-z]+/g, word => {
        return word.charAt(0).toUpperCase() + word.slice(1)
      })
    },
    getContextValue(key) {
      if (commands[key].context) {
        // FIXME: optimize context pattern
        return this.$parent[commands[key].context.slice(1)] ? '.1' : '.0'
      } else {
        return ''
      }
    },
  },

  props: ['menu', 'show'],
  inject: ['tabs', 'execute', 'executeCommand'],
  render: VueCompile(`<transition name="el-zoom-in-top">
    <ul v-show="show" class="tm-menu">
      <li v-for="item in menu">
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
        <div v-else class="menu-item" @click="executeCommand(item)">
          <a class="label">{{ $t('editor.menu.' + item + getContextValue(item)) }}</a>
          <span class="binding">{{ displayKeyBinding(item) }}</span>
        </div>
      </li>
    </ul>
  </transition>`)
}