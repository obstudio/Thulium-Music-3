
module.exports = {
  name: 'home',
  data () {
    return {
      msg: 'Welcome to Thulium Music Player'
    }
  },
  template: `<div class="home">
    <h1>{{ msg }}</h1>
    <p>最近编辑的歌曲...</p>
  </div>`
}
