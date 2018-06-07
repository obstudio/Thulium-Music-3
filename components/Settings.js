
module.exports = {
  name: 'TmSettings',

  data() {
    return {
      library: global.library,
      msg: 'Settings'
    }
  },

  computed: {
    captions: () => global.user.state.Captions.settings,
    settings: () => global.user.state.Settings,
    language: {
      get: () => {
        return global.library.Languages.find(lang => {
          return lang.key === global.user.state.Settings.language
        }).description
      },
      set: label => {
        const key = global.library.Languages.find(lang => lang.description === label).key
        global.user.state.Settings.language = key
        global.user.state.Captions = require('../languages/' + key + '/general.json')
      }
    },
    theme: {
      get: () => {
        return global.library.Themes.find(theme => {
          return theme.key === global.user.state.Settings.theme
        }).description
      },
      set: label => {
        const key = global.library.Themes.find(theme => theme.description === label).key
        global.user.state.Settings.theme = key
      }
    }
  },

  render: VueCompile(`<div class="tm-settings">
    <h1>{{ captions.title }}</h1>
    <h2>{{ captions.basic }}</h2>
    <el-row class="setting">
      <el-col :span="8" class="caption">{{ captions.language }}</el-col>
      <el-col :span="12" :offset="4" class="control">
        <el-radio-group v-model="language" size="medium">
          <el-radio-button v-for="item in library.Languages" :label="item.description"/>
        </el-radio-group>
      </el-col>
    </el-row>
    <el-row class="setting">
      <el-col :span="8" class="caption">{{ captions.theme }}</el-col>
      <el-col :span="12" :offset="4" class="control">
        <el-radio-group v-model="theme" size="medium">
          <el-radio-button v-for="item in library.Themes" :label="item.description"/>
        </el-radio-group>
      </el-col>
    </el-row>
    <h2>{{ captions.editor }}</h2>
    <el-row class="setting">
      <el-col :span="8" class="caption">{{ captions.minimap }}</el-col>
      <el-col :span="12" :offset="4" class="control">
        <el-switch v-model="settings.minimap"/>
      </el-col>
    </el-row>
  </div>`)
}
