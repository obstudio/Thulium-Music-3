
module.exports = {
  name: 'TmSettings',

  data() {
    return {
      msg: 'Settings'
    }
  },

  computed: {
    user: () => global.user.state,
    language: {
      get: () => global.user.state.Settings.language,
      set: (value) => global.user.commit('setSetting', {key: 'language', value})
    }
  },

  render: VueCompile(`<div class="tm-settings">
    <h1>{{ msg }}</h1>
    <el-select v-model="language" placeholder="请选择">
      <el-option v-for="item in user.Languages" :key="item.key" :label="item.description" :value="item.key"/>
    </el-select>
  </div>`)
}
