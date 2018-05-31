const TmLoading = require('./TmLoading')
const { defineLanguage } = require('../../library/editor/Editor')
const TmMonacoEditor = require('./TmMonacoEditor')
const theme = require(__dirname + '/../../themes/dark.json').tm

module.exports = {
  name: 'TmEditor',
  components: {
    TmLoading,
    TmMonaco: () => ({
      component: new Promise((resolve, reject) => {
        amdRequire(['vs/editor/editor.main'], () => {
          defineLanguage(theme)
          resolve(TmMonacoEditor)
        })
      }),
      loading: TmLoading,
      error: TmLoading,
      delay: 200,
      timeout: 20000
    })
  },
  data () {
    return {
    }
  },
  methods: {

  },
  props: ['width', 'height'],
  template:`<div id="editor">
    <transition mode="in-out">
      <tm-monaco :width="width" :height="height"></tm-monaco>
    </transition>
</div>`
}
