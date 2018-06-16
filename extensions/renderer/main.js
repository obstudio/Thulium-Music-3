const Thulium = require('../../library/Thulium')

module.exports = {
  name: 'renderer',
  data() {
    return {
      tm: Thulium.$remote(this.tab.tm).adapt()
    }
  },
  mounted() {
    this.ctx = this.$refs.canvas.getContext('2d')
    this.ctx.fillStyle = 'green'
    this.ctx.fillRect(10, 10, 100, 100)
    this.tm.parse()
  },
  methods: {},
  inject: ['tab'],
  props: ['width', 'height', 'isFull'],
  render: VueCompile(`<div class="renderer">
    {{ tm }}
  </div>`)
}