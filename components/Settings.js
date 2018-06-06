
module.exports = {
  name: 'TmSettings',
  data () {
    return {
      msg: 'Settings',
      options: Object.keys(window.user.Languages),
      value: window.user.Settings.language
    }
  },
  template: `<div class="tm-settings">
    <h1>{{ msg }}</h1>
    <el-row>
      <el-col :span="10">Emmmmm</el-col>
      <el-col :span="10">
        <el-select v-model="value" placeholder="请选择">
          <el-option v-for="item in options" :key="item.key" :label="item.description" :value="item.key">
          </el-option>
        </el-select>
      </el-col>
    </el-row>
  </div>`
}
