<template>
  <div class="hello">
    <h1>{{ msg }}</h1>
    <router-link to="/editor">Open editor</router-link>
    <router-link to="/docs">Open doc</router-link>
  </div>
</template>

<script>
export default {
  name: 'HelloWorld',
  data () {
    return {
      msg: 'Welcome to Thulium Music Player'
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
