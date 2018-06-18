module.exports = {
  name: 'home',
  render: VueCompile(`<div class="home">
    <h1>{{ $t('homepage.welcome') }}</h1>
  </div>`)
}
