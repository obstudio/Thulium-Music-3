module.exports = {
  name: 'TmSettings',
  components: {
    TmRadio: require('./radio'),
    TmSwitch: require('./switch')
  },

  data() {
    return {
      library: global.library
    }
  },

  computed: {
    settings() {
      return this.$store.state.Settings
    },
    language: {
      get() {
        return global.library.Languages.find(lang => {
          return lang.key === this.settings.language
        }).description
      },
      set(label) {
        const key = global.library.Languages.find(lang => lang.description === label).key
        this.settings.language = key
        this.$i18n.locale = key
      }
    },
    theme: {
      get() {
        const description = global.library.Themes.find(theme => {
          return theme.key === this.settings.theme
        }).description
        if (description[this.settings.language]) {
          return description[this.settings.language]
        } else {
          return description.default
        }
      },
      set(label) {
        const key = global.library.Themes.find(theme => {
          if (theme.description[this.settings.language]) {
            return theme.description[this.settings.language] === label
          } else {
            return theme.description.default === label
          }
        }).key
        this.$store.state.Styles = global.themes[key]
        this.settings.theme = key
        global.editors.forEach((editor) => {
          editor.updateOptions({ theme: key })
        })
        if (window.monaco.editor) window.monaco.editor.setTheme(key)
      }
    }
  },

  render: VueCompile(`<div class="tm-settings">
    <h1>{{ $t('settings.title') }}</h1>
    <h2>{{ $t('settings.basic') }}</h2>
    <tm-radio model="language" :caption="$t('settings.language')" library="Languages"/>
    <tm-radio model="theme" :caption="$t('settings.theme')" library="Themes"/>
    <h2>{{ $t('settings.editor') }}</h2>
    <tm-radio model=".line-ending" :caption="$t('settings.line-ending')" library="LineEndings"/>
    <tm-switch model=".minimap" :caption="$t('settings.minimap')"/>
  </div>`)
}
