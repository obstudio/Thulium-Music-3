
module.exports = {
  name: 'HelloWorld',
  data () {
    return {
      msg: 'Welcome to Thulium Music Player'
    }
  },
  template: `<div class="hello">
    <h1>{{ msg }}</h1>
    <router-link to="/editor">Open editor</router-link>
    <router-link to="/docs">Open doc</router-link>
  </div>`
}
