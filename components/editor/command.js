const fs = require('fs')
const { dialog } = require('electron').remote

module.exports = [
  {
    id: 'tm-save',
    label: 'Save File',
    keybindings: [ window.monaco.KeyMod.CtrlCmd | window.monaco.KeyCode.KEY_S ],
    precondition: null,
    keybindingContext: null,
    contextMenuGroupId: 'navigation',
    contextMenuOrder: 1.5,
    run(editor) {
      const tab = editor.vue.current
      if (!tab.changed) return
      if (tab.path) {
        tab.save()
        return
      }
      const firstLine = editor.getModel().getLineContent(1)
      let name
      if (firstLine !== '' && firstLine.startsWith('//')) {
        name = firstLine.slice(2).trim()
      } else {
        name = editor.vue.$t('editor.new-file')
      }
      dialog.showSaveDialog(null, {
        title: editor.vue.$t('editor.save-as'),
        defaultPath: name,
        filters: [
          { name: editor.vue.$t('editor.thulium'), extensions: ['tm', 'tml'] },
          { name: editor.vue.$t('editor.all-files'), extensions: ['*'] }
        ]
      }, path => tab.save(path))
    }
  },

  {
    id: 'tm-play',
    label: 'Play/Pause',
    keybindings: [ window.monaco.KeyMod.CtrlCmd | window.monaco.KeyCode.KEY_P],
    precondition: null,
    keybindingContext: null,
    contextMenuGroupId: 'navigation',
    contextMenuOrder: 1.5,
    run: (editor) => {
      const value = editor.getValue()
      if (this.player) {
        if (this.player.value === value) {
          this.player.toggle()
        } else {
          this.player.close()
          this.player = this.$createPlayer(value)
          this.player.play()
        }
      } else {
        this.player = this.$createPlayer(value)
        this.player.play()
      }
    }
  },
  
  {
    id: 'tm-stop',
    label: 'Stop Playing',
    keybindings: [
      window.monaco.KeyMod.CtrlCmd | window.monaco.KeyCode.KEY_T
    ],
    precondition: null,
    keybindingContext: null,
    contextMenuGroupId: 'navigation',
    contextMenuOrder: 1.5,
    run() {
      if (this.player) {
        this.player.close()
        this.player = undefined
      }
    }
  }
]