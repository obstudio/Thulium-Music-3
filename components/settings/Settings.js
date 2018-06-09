module.exports = {
  name: 'TmSettings',
  components: {
    TmRadio: require('./radio'),
    TmSwitch: require('./switch')
  },

  data() {
    return {
      library: global.library,
      active: ['1', '2']
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
      set(label) {
        const key = global.library.Languages.find(lang => lang.description === label).key
        global.user.state.Settings.language = key
        this.$i18n.locale = key
      }
    },
    theme: {
      get: () => {
        const description = global.library.Themes.find(theme => {
          return theme.key === global.user.state.Settings.theme
        }).description
        if (description[global.user.state.Settings.language]) {
          return description[global.user.state.Settings.language]
        } else {
          return description.default
        }
      },
      set: label => {
        const key = global.library.Themes.find(theme => {
          if (theme.description[global.user.state.Settings.language]) {
            return theme.description[global.user.state.Settings.language] === label
          } else {
            return theme.description.default === label
          }
        }).key
        global.user.state.Styles = global.themes[key]
        global.user.state.Settings.theme = key
        if (window.monaco.editor) window.monaco.editor.setTheme(key)
      }
    }
  },

  render: VueCompile(`<div class="tm-settings">
    <h1>{{ $t('settings.title') }}</h1>
    <h2>{{ $t('settings.basic') }}</h2>
    <tm-radio model="language" :caption="$t('settings.language')" :library="library.Languages"/>
    <tm-radio model="theme" :caption="$t('settings.theme')" :library="library.Themes"/>
    <h2>{{ $t('settings.editor') }}</h2>
    <tm-radio model=".line-ending" :caption="$t('settings.line-ending')" :library="library.LineEndings"/>
    <tm-switch model=".minimap" :caption="$t('settings.minimap')"/>
  </div>`)
}
