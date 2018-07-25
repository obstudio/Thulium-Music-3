const TmTab = require('./Tab')

const defaultState = {
  extensionHeight: 200,
  extensionShowed: false,
  extensionFull: false,
  menubar: false,
  currentId: null
}

module.exports = {
  data() {
    const tabString = localStorage.getItem('tabs')
    const stateString = localStorage.getItem('state')
    let state, tabs
    try {
      const tabsData = JSON.parse(tabString)
      if (!tabsData || tabsData.length === 0) {
        tabs = [ new TmTab() ]
      } else {
        tabs = tabsData.map(tab => new TmTab(tab))
      }
    } catch (e) {
      console.error('The tabs information is malformed.')
      tabs = [ new TmTab() ]
    }
    try {
      state = JSON.parse(stateString) || {}
    } catch (e) {
      console.error('The state information is malformed.')
      console.error(e)
      state = {}
    }
    const current = tabs.find(tab => tab.id === state.currentId)
    delete state.currentId
    return Object.assign(defaultState, state, {
      tabs: tabs,
      current: current ? current : tabs[0]
    })
  },

  mounted() {
    addEventListener('beforeunload', () => {
      localStorage.setItem('tabs', JSON.stringify(this.tabs))
      localStorage.setItem('state', JSON.stringify({
        extensionHeight: this.extensionHeight,
        extensionShowed: this.extensionShowed,
        extensionFull: this.extensionFull,
        currentId: this.current.id,
        menubar: this.menubar
      }))
    })
    this.$watch(
      function() {
        return this.settings['line-ending']
      },
      function() {
        TmTab.config['line-ending'] = this.settings['line-ending']
        this.tabs.map(tab => this.refresh(tab))
      }
    )
  }
}