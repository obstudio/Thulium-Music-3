<template>
<el-menu background-color="#545c64" text-color="#fff"
        active-text-color="#ffd04b" :router="true">
  <el-menu-item v-for="item in items" :key="item" :index="makeURL(item)">
    <i class="el-icon-menu"></i>
    <span slot="title">{{item}}</span>
  </el-menu-item>
</el-menu>
</template>

<script>
export default {
  name: 'TmDocDirectory',
  data() {
    return {}
  },
  methods: {
    makeURL (name) {
      return `/docs/${name}`
    }
  },
  props: ['items']
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
