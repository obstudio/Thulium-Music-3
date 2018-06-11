const TmTab = require('./Tab')

const defaultState = {
  extensionHeight: 200,
  extensionShowed: false,
  extensionFull: false,
  toolbar: false
}

module.exports = {
  load() {
    const tabString = localStorage.getItem('tabs')
    let tabs, current = null
    if (tabString === null) {
      tabs = [ new TmTab() ]
    } else {
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
    }
    for (const tab of tabs) {
      if (tab.active) current = tab
    }
    if (!current) current = tabs[0]
    const stateString = localStorage.getItem('state')
    let state
    if (stateString === null) {
      state = {}
    } else {
      try {
        state = JSON.parse(stateString)
      } catch (e) {
        console.error('The state information is malformed.')
        console.error(e)
        state = {}
      }
    }
    return Object.assign(defaultState, state, { tabs, current })
  },

  save(vm) {
    localStorage.setItem('tabs', JSON.stringify(vm.tabs))
    localStorage.setItem('state', JSON.stringify({
      extensionHeight: vm.extensionHeight,
      extensionShowed: vm.extensionShowed,
      extensionFull: vm.extensionFull,
      toolbar: vm.toolbar
    }))
  }
}