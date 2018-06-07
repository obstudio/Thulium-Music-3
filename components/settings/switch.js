module.exports = {
  name: 'TmSwitch',
  props: ['caption', 'model'],

  computed: {
    value: require('./value')
  },

  render: VueCompile(`<el-row class="setting">
    <el-col :span="8" class="caption">{{ caption }}</el-col>
    <el-col :span="12" :offset="4" class="control">
      <el-switch v-model="value"/>
    </el-col>
  </el-row>`)
}
