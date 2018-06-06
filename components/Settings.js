
module.exports = {
  name: 'TmSettings',

  data() {
    return {
      lib: global.library,
      msg: 'Settings'
    }
  },

  computed: {
    captions: () => global.user.state.Captions.settings,
    language: {
      get: () => global.user.state.Settings.language,
      set: (value) => {
        global.user.state.Settings.language = value
        global.user.state.Captions = require('../languages/' + value + '/general.json')
      }
    }
  },

  render: VueCompile(`<div class="tm-settings">
    <h1>{{ captions.title }}</h1>
    <el-select v-model="language" placeholder="请选择语言">
      <el-option v-for="item in lib.Languages" :key="item.key" :label="item.description" :value="item.key"/>
    </el-select>
  </div>`)
}
