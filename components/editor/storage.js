const TmTab = require('./Tab')

const defaultState = {
  extensionHeight: 200,
  extensionShowed: false,
  extensionFull: false,
  toolbar: false,
  currentId: null
}

module.exports = {
  load() {
    const tabString = localStorage.getItem('tabs')
    const stateString = localStorage.getItem('state')
    let state, tabs
    try {
      const tabsData = JSON.parse(tabString)
      if (tabsData.length === 0) {
        tabs = [ new TmTab() ]
      } else {
        tabs = tabsData.map(tab => new TmTab(tab))
      }
    } catch (e) {
      console.error('The tabs information is malformed.')
      tabs = [ new TmTab() ]
    }
    try {
      state = JSON.parse(stateString)
    } catch (e) {
      console.error('The state information is malformed.')
      console.error(e)
      state = {}
    }
    const current = tabs.find(tab => tab.id === state.currentId)
    return Object.assign(defaultState, state, {
      tabs: tabs,
      current: current ? current : tabs[0]
    })
  },

  save(vm) {
    localStorage.setItem('tabs', JSON.stringify(vm.tabs))
    localStorage.setItem('state', JSON.stringify({
      extensionHeight: vm.extensionHeight,
      extensionShowed: vm.extensionShowed,
      extensionFull: vm.extensionFull,
      currentId: vm.current.id,
      toolbar: vm.toolbar
    }))
  }
}