const { dialog } = require('electron').remote
const TmTab = require('./Tab')
const path = require('path')
const fs = require('fs')

module.exports = {
  toggleMenubar() {
    if (this.menubar) {
      this.menubar = false
    } else {
      this.menubar = true
      const remainHeight = this.height - 34 - 24 - 34
      if (this.extensionHeight > remainHeight) {
        this.extensionHeight = remainHeight
      }
    }
  },

  closeTab(id) {
    if (!id) id = this.current.id
    const index = this.tabs.findIndex(tab => tab.id === id)
    const close = () => {
      this.tabs.splice(index, 1)
      if (this.tabs.length === 0) {
        this.addTab()
      } else if (this.current.id === id) {
        this.switchTabByIndex(index === 0 ? 0 : index - 1)
      }
    }
    if (this.tabs[index].changed) {
      this.$confirm(this.$t('editor.close-tab-msg'), this.$t('message.tip'), {
        confirmButtonText: this.$t('message.confirm'),
        cancelButtonText: this.$t('message.cancel'),
        type: 'warning'
      }).then(close).catch(() => {})
    } else {
      close()
    }
  },

  closeAllTabs() {
    this.tabs.splice(0, Infinity, new TmTab())
    this.switchTabByIndex(0)
  },

  closeOtherTabs(id) {
    if (!id) id = this.current.id
    const index = this.tabs.findIndex(tab => tab.id === id)
    this.switchTabByIndex(index)
    this.tabs.splice(index + 1, Infinity)
    this.tabs.splice(0, index)
  },

  closeTabsToRight(id) {
    if (!id) id = this.current.id
    const index = this.tabs.findIndex(tab => tab.id === id)
    if (this.tabs.findIndex(tab => tab.id === this.current.id) > index) {
      this.switchTabByIndex(index)
    }
    this.tabs.splice(index + 1, Infinity)
  },

  switchTabById(id) {
    this.switchTabByIndex(this.tabs.findIndex(tab => tab.id === id))
  },

  switchTabByIndex(index) {
    const newTab = this.tabs[index]
    if (this.current === newTab) return
    this.current.viewState = this.editor.saveViewState()
    this.current = newTab
    this.activate()
  },

  addTab(insert = true, data = {}) {
    const index = !insert ? this.tabs.length
      : this.tabs.findIndex(tab => tab.id === this.current.id) + 1
    const tab = new TmTab(data)
    this.tabs.splice(index, 0, tab)
    this.switchTabByIndex(index)
    tab.onModelChange((e) => {
      this.refresh(tab, e)
    })
    tab.checkChange()
  },

  loadFile(filepath) {
    if (!['.tm', '.tml'].includes(path.extname(filepath))) return
    fs.readFile(filepath, { encoding: 'utf8' }, (_, data) => {
      const previous = this.current
      this.addTab(true, {
        title: path.basename(filepath).replace(/\.tml?$/, ''),
        path: filepath,
        value: data,
        origin: data
      })
      if (previous.isEmpty()) {
        this.closeTab(previous.id)
      } else {
        const prevIndex = this.tabs.findIndex(tab => tab.id === previous.id)
        if (prevIndex + 2 < this.tabs.length && this.tabs[prevIndex + 2].isEmpty) {
          this.closeTab(this.tabs[prevIndex + 2].id)
        }
      }
    })
  },

  openFile() {
    dialog.showOpenDialog(null, {
      title: this.$t('editor.open-file'),
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: this.$t('editor.thulium'), extensions: ['tm', 'tml'] },
        { name: this.$t('editor.all-files'), extensions: ['*'] }
      ]
    }, (filepaths) => {
      filepaths.forEach(filepath => this.loadFile(filepath))
    })
  },

  save(id) {
    const tab = id ? this.tabs.find(tab => tab.id === id) : this.current
    if (!tab.changed) return
    if (tab.path) {
      tab.save()
    } else {
      this.saveAs(id)
    }
  },

  saveAll() {
    this.tabs.forEach(tab => this.save(tab.id))
  },

  saveAs(id) {
    const tab = id ? this.tabs.find(tab => tab.id === id) : this.current
    const firstLine = tab.model.getLineContent(1)
    let name
    if (firstLine !== '' && firstLine.startsWith('//')) {
      name = firstLine.slice(2).trim()
    } else {
      name = this.$t('editor.new-file')
    }
    dialog.showSaveDialog(null, {
      title: this.$t('editor.save-as'),
      defaultPath: name,
      filters: [
        { name: this.$t('editor.thulium'), extensions: ['tm', 'tml'] },
        { name: this.$t('editor.all-files'), extensions: ['*'] }
      ]
    }, (filepath) => tab.save(filepath))
  }
}