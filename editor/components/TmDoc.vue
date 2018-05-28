<template>
  <el-row :gutter="30">
    <el-col :span="3" :offset="3" :style="{height}">
        <tm-doc-directory :items="items" style="height: 100%"></tm-doc-directory>
    </el-col>
    <el-col :span="9" :offset="3">
        <tm-doc-container :doc="doc"></tm-doc-container>
    </el-col>
  </el-row>
</template>

<script>
import TmDocDirectory from './TmDocDirectory'
import TmDocContainer from './TmDocContainer'
const defaultValue = 'main'
export default {
  name: 'TmDoc',
  components: {
    TmDocDirectory,
    TmDocContainer
  },
  data () {
    return {
      doc: defaultValue,
      items: ['main', 'GraceNote', 'Foo'],
      height: `${window.innerHeight - 100}px`
    }
  },
  beforeRouteUpdate (to, from, next) {
    this.doc = to.params.doc || defaultValue
    next()
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
