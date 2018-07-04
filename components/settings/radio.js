module.exports = {
  name: 'TmRadio',
  props: ['caption', 'model', 'library'],

  computed: {
    value: require('./value'),
    options() {
      return this.library.map(item => {
        if (item.description) {
          if (item.description instanceof Object) {
            if (item.description[this.$store.state.Settings.language]) {
              return item.description[this.$store.state.Settings.language]
            } else {
              return item.description.default
            }
          } else {
            return item.description
          }
        } else {
          return item
        }
      })
    }
  },

  render: VueCompile(`<el-row class="setting">
    <el-col :span="8" class="caption">{{ caption }}</el-col>
    <el-col :span="12" :offset="4" class="control">
      <el-radio-group v-model="value" size="medium">
        <el-radio-button v-for="item in options" :label="item"/>
      </el-radio-group>
    </el-col>
  </el-row>`)
}
